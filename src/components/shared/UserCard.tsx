import React, { useEffect, useState } from "react";
import { Models } from "appwrite";
import Profilephoto from "./Profilephoto";
import CircleLoader from "./CircleLoader";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import {
  useGetCurrentUser,
  useSettlmentById,
  useMakeSettlement,
  useGetUserById,
} from "@/lib/react-query/queries";
import { toast } from "../ui";

type UserCardProps = {
  user: Models.Document;
  userCanPay: number;
  friendCanPay: number;
};

const UserCard: React.FC<UserCardProps> = ({
  user,
  userCanPay,
  friendCanPay,
}) => {
  const { data: currentUser } = useGetCurrentUser();
  const { data: fullUserDoc } = useGetUserById(user.$id);

  const navigate = useNavigate();

  const { data: settlementDataPayer, isLoading: issettlementDataPayerLoading } =
    useSettlmentById(currentUser?.$id, user.$id);

  const {
    data: settlementDataReceiver,
    isLoading: issettlementDataReceiverLoading,
  } = useSettlmentById(user.$id, currentUser?.$id);

  const totalAmountPayer =
    settlementDataPayer?.documents?.reduce((sum: number, settlementItem) => {
      return sum + parseFloat(settlementItem.Amount);
    }, 0) ?? 0;

  const totalAmountReceiver =
    settlementDataReceiver?.documents?.reduce((sum: number, settlementItem) => {
      return sum + parseFloat(settlementItem.Amount);
    }, 0) ?? 0;

  const [payeer, setpayeer] = useState(0);
  const [receiver, setreceiver] = useState(0);

  useEffect(() => {
    const newSum = friendCanPay - totalAmountPayer;
    setpayeer(newSum);
  }, [totalAmountPayer, friendCanPay]);

  useEffect(() => {
    const newSum = userCanPay - totalAmountReceiver;
    setreceiver(newSum);
  }, [totalAmountReceiver, userCanPay]);

  const handlePayment = () => {
    // Determine net amount current user owes friend
    const net = receiver - payeer;
    if (net >= 0) {
      toast({ title: "No payment required. You don't owe this user." });
      return;
    }

    const amount = Math.abs(net).toFixed(2);
    const upiLink = generateUPILink(amount);
    if (upiLink) {
      // Instead of directly navigating, open a QR modal so user can scan
      setQrLink(upiLink);
      setQrAmount(amount);
      setQrModal(true);
    } else {
      toast({ title: "User has not linked a UPI ID" });
    }
  };

  const generateUPILink = (transactionAmount: string) => {
    // Try to use the friend's linked UPI VPA from whichever document is available
    const payeeVPA = (user as any)?.upi || (fullUserDoc as any)?.upi;
    if (!payeeVPA) return null;

    // Determine display name
    const displayName = (user as any)?.name || (fullUserDoc as any)?.name || "";

    // Construct the UPI link
    const upiLink = `upi://pay?pa=${encodeURIComponent(
      payeeVPA
    )}&pn=${encodeURIComponent(displayName)}&am=${transactionAmount}&cu=INR`;
    return upiLink;
  };

  // QR modal state
  const [qrModal, setQrModal] = useState(false);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [qrAmount, setQrAmount] = useState<string>("0.00");

  const closeQrModal = () => {
    setQrModal(false);
    setQrLink(null);
    setQrAmount("0.00");
  };

  const copyUPIToClipboard = async () => {
    const payeeVPA = (user as any)?.upi || (fullUserDoc as any)?.upi;
    if (!payeeVPA) return;
    try {
      await navigator.clipboard.writeText(payeeVPA);
      toast({ title: "UPI copied to clipboard" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to copy" });
    }
  };

  const [isBlurred, setIsBlurred] = useState(false);

  const handleButtonClick = () => {
    setIsBlurred((prevIsBlurred) => !prevIsBlurred);
  };

  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal(!modal);
  };

  if (modal) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const { mutateAsync: makeSettlement, isLoading: isMakingSettlement } =
    useMakeSettlement();

  const handleConfirmSimplify = async () => {
    try {
      // net > 0 => friend owes currentUser
      // net < 0 => currentUser owes friend
      const net = receiver - payeer;

      if (!currentUser?.$id) {
        toast({ title: "Current user not available" });
        return;
      }

      if (net === 0) {
        toast({ title: "No outstanding debts to simplify" });
        setModal(false);
        return;
      }

      if (net > 0) {
        // friend owes current user
        await makeSettlement({
          payerId: user.$id,
          receiverId: currentUser.$id,
          amount: parseFloat(net.toFixed(2)),
        });
        toast({ title: `Recorded settlement: ${user.name} -> you ₹${net.toFixed(2)}` });
      } else {
        // current user owes friend
        const amt = Math.abs(net);
        await makeSettlement({
          payerId: currentUser.$id,
          receiverId: user.$id,
          amount: parseFloat(amt.toFixed(2)),
        });
        toast({ title: `Recorded settlement: you -> ${user.name} ₹${amt.toFixed(2)}` });
      }
      setModal(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to record settlement" });
    }
  };

  return (
    <div>
      <div
        style={{ display: "flex", justifyContent: "space-between" }}
        className={`pb-3 text-white `}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Profilephoto name={user} />
          <p className="text-lg font-bold mb-1 pl-3 text-blue-500">
            {user.name}
          </p>
        </div>

        <button
          className={`bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline ${
            friendCanPay === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleButtonClick}
          disabled={friendCanPay === 0}>
          Settle Up
        </button>
      </div>

      <div className={`app-container ${isBlurred ? "expanded" : ""}`}>
        <div className={`${isBlurred ? "expanded" : "hidden"}`}>
          <Button
            className="ml-2"
            onClick={() =>
              navigate(`/settlement/${payeer.toFixed(1)}/${user.$id}`)
            }>
            <img
              className="mr-2" // Add margin to adjust spacing between text and image
              width="40"
              height="40"
              src="/assets/icons/cash.png"
              alt="paytm"
            />
            Record By Cash
          </Button>
          <Button className="m-2 flex items-center" onClick={handlePayment}>
            <img
              className="mr-2" // Add margin to adjust spacing between text and image
              width="48"
              height="48"
              src="/assets/icons/upi.png"
              alt="paytm"
            />
            Pay with UPI
          </Button>
          {/* Simplify Debts button removed as per user request */}
        </div>
      </div>

      <div className={` ${isBlurred ? "blurred2 capitalize" : "capitalize"}`}>
        {issettlementDataPayerLoading || issettlementDataReceiverLoading ? (
          <CircleLoader />
        ) : (
          <>
            <p>
              "{user.name}" owes you{" "}
              <span className="text-lg font-bold text-green-500">
                &#8377;&nbsp;{receiver.toFixed(1)}
              </span>
            </p>
            <p>
              You owe "{user.name}"{" "}
              <span className="text-lg font-bold text-red">
                &#8377;&nbsp;{payeer.toFixed(1)}
              </span>
            </p>
          </>
        )}
      </div>
      {modal && (
        <div className="modal">
          <div onClick={toggleModal} className="overlay"></div>
          <div className="modal-content">
            <h2 className="text-yellow-400	 text-2xl font-bold mb-2">
              Simplify Debts
            </h2>
            <p className="text-white font-semibold mb-2">
              Automatically Combines debts to reduce the total number of
              repayment between two user
            </p>
            <Button className="btn bg-red hover:bg-red" onClick={toggleModal}>
              Cancel
            </Button>
            <Button
              className="btn m-2 bg-green-400"
              onClick={handleConfirmSimplify}
              disabled={isMakingSettlement}
            >
              {isMakingSettlement ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      )}
      {qrModal && qrLink && (
        <div className="modal">
          <div onClick={closeQrModal} className="overlay"></div>
          <div className="modal-content">
            <h2 className="text-yellow-400 text-2xl font-bold mb-2">Pay with UPI</h2>
            <p className="text-white font-semibold mb-2">
              Scan this QR to pay
            </p>
            <div className="flex flex-col items-center">
              <img
                alt="UPI QR"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  qrLink
                )}`}
                width={300}
                height={300}
              />
              <p className="mt-3 text-white text-lg">
                Amount: <span className="font-bold">&#8377;&nbsp;{parseFloat(qrAmount).toFixed(2)}</span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              

              <Button className="bg-gray-600" onClick={copyUPIToClipboard}>
                Copy UPI ID
              </Button>

              <Button className="bg-red-600" onClick={closeQrModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;
