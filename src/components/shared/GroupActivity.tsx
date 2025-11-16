import { Models } from "appwrite";
import {
  useDeleteActivity,
  useGetCurrentUser,
} from "@/lib/react-query/queries";
import DateDisplay from "./DateDisplay";
import ActivityImage from "./ActivityImage";
import { Button } from "../ui/button";
import Loader from "./Loader";
import { useState } from "react";
import { toast } from "../ui";

type UserCardProps = {
  activity: Models.Document;
};

const GroupActivity = ({ activity }: UserCardProps) => {
  const { data: currentUser } = useGetCurrentUser();
  const [isHovered, setIsHovered] = useState(false);
  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal(!modal);
  };

  if (modal) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const { mutateAsync: deleteActivityMutation, isLoading: isLoadingExpense } =
    useDeleteActivity();

  const handleDelete = async () => {
    try {
      setModal(!modal);
      await deleteActivityMutation({ activityId: activity.$id });
      toast({
        title: `Expense Deleted Successfully.`,
      });
    } catch (error) {
      toast({
        title: `Failed to delete activity. Please try again.`,
      });
    }
  };
  const isPaidByCurrentUser = activity.PaidBy.$id === currentUser?.$id;
  const isCurrentUserInvolved =
    activity.splitMember?.some(
      (member: { $id: string }) => member.$id === currentUser?.$id
    ) || false;
  const splitCount = activity.splitMember?.length ?? 0;

  // Removed amountMessage logic as per user request

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "space-between" }}
        className="pb-2">
        <div style={{ display: "flex", alignItems: "center" }}>
          <ActivityImage Desc={activity.Desc} Type={"activity"} />
          <p className="text-lg font-bold mb-1 mt-2">&ensp;{activity.Desc}</p>
        </div>
        <span className="text-blue-500 text-lg font-bold mt-2">
          &#8377;{activity.Amout}
        </span>
      </div>

      <DateDisplay dateTimeString={activity.Time} />
      <p>
        Added by{" "}
        <span
          className={`font-semibold capitalize ${
            isPaidByCurrentUser ? "text-green-500 " : "text-teal-400"
          }`}>
          "{activity.PaidBy.name}"
        </span>{" "}
        Split in{" "}
        <span className="font-bold text-teal-400 capitalize">
          {activity.splitMember?.map(
            (member: {
              UserName: string;
              email: string;
              accountId: string;
              name: string;
              $id: string;
            }) => <span key={member.$id}>{member.name}, </span>
          )}
        </span>{" "}
      </p>
      <Button
        onClick={toggleModal}
        style={{
          backgroundColor:
            isHovered || isLoadingExpense ? "#FF6347" : "#E53E3E",
          color: "white",
          padding: "8px 12px",
          borderRadius: "8px",
          cursor: isLoadingExpense ? "not-allowed" : "pointer",
          opacity: isLoadingExpense ? 0.6 : 1,
          transition: "background-color 0.3s",
          float: "right",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isLoadingExpense}>
        {isLoadingExpense && <Loader />}
        {isLoadingExpense ? "Deleting..." : "Delete"}
      </Button>
      {modal && (
        <div className="modal">
          <div onClick={handleDelete} className="overlay"></div>
          <div className="modal-content">
            <h2 className="text-neutral-300	 text-2xl font-bold mb-2">
              Do you want to delete this expense?
            </h2>
            <p className="text-neutral-400 font-semibold mb-2">
              If deleted, the expense will be permanently removed.
            </p>
            <Button className="btn bg-red hover:bg-red" onClick={toggleModal}>
              Cancle
            </Button>
            <Button className="btn m-2 bg-green-600" onClick={handleDelete}>
              Confirm
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupActivity;
