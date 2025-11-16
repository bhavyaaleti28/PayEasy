import {
  useGetCurrentUser,
  useSignOutAccount,
  useUpdateUser,
} from "@/lib/react-query/queries";
import { Loader } from "@/components/shared";
import Profilephoto from "@/components/shared/Profilephoto";
import { useUserContext, INITIAL_USER } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileEditValidation } from "@/lib/validation";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui";

const Profile = () => {
  const { mutate: signOut } = useSignOutAccount();
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useUserContext();
  const handleSignOut = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    signOut();
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    navigate("/sign-in");
  };

  const { data: currentUser } = useGetCurrentUser();
  const { mutateAsync: updateUser, isLoading: isUpdating } = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(ProfileEditValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      upi: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        name: currentUser.name || "",
        username: currentUser.UserName || "",
        email: currentUser.email || "",
        upi: (currentUser as any).upi || "",
      });
    }
  }, [currentUser]);

  const handleContact = () => {
    if (!currentUser) return;
    const upi = (currentUser as any)?.upi;
    if (upi) {
      const upiLink = `upi://pay?pa=${encodeURIComponent(
        upi
      )}&pn=${encodeURIComponent(currentUser.name || "")}&cu=INR`;
      window.location.href = upiLink;
      return;
    }

    // fallback: copy email to clipboard
    const email = currentUser.email;
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      toast({ title: "Email copied to clipboard" });
    } else {
      toast({ title: "No contact method available" });
    }
  };

  const onSubmit = async (values: any) => {
    if (!currentUser) return;
    try {
      const updated = await updateUser({
        userId: currentUser.$id,
        updates: {
          name: values.name,
          UserName: values.username,
          email: values.email,
          upi: values.upi,
        },
      });
      // update context
      if (updated && (updated as any).$id) {
        // setUser expects same shape; refresh will be triggered by react-query
        toast({ title: "Profile updated" });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      const e: any = err as any;
      const message = e?.message || (e?.response && e.response.message) || "Failed to update profile";
      toast({ title: message });
    }
  };
  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <div className="common-container">
      <div className="user-container">
        <div className="container p-5">
          <h2 className="text-2xl font-bold mb-6">Profile</h2>
          <section className="text-white bg-slate-800 p-4 shadow-md rounded-md">
            <h3 className="text-xl font-bold mb-4">Account</h3>

            <div
              style={{ display: "flex", alignItems: "center" }}
              className="pb-3 text-white">
              <Profilephoto name={currentUser} />
              <span className="text-lg font-bold mb-1 pl-3 text-blue-500 capitalize">
                {currentUser.name} {" "}
              </span>
            </div>

            {!isEditing ? (
              <>
                <div className="mb-4">
                  <span className="text-gray-200">User Name:</span>
                  <span className="font-semibold">@{currentUser.UserName}</span>
                </div>
                <div className="mb-4">
                  <span className="text-gray-200">Email:</span>
                  <span className="text-white font-semibold">
                    {currentUser.email}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-gray-200">UPI:</span>
                  <span className="text-white font-semibold">
                    {(currentUser as any).upi || "Not linked"}
                  </span>
                </div>
                <button
                  className="bg-blue-500 font-semibold text-white px-4 py-2 rounded-md mr-2"
                  onClick={() => setIsEditing(true)}>
                  Edit
                </button>
                <button
                  className="bg-green-500 font-semibold text-white px-4 py-2 rounded-md"
                  onClick={handleContact}>
                  Contact
                </button>
              </>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="shad-form_label">Name</FormLabel>
                          <FormControl>
                            <Input className="shad-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mb-3">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="shad-form_label">Username</FormLabel>
                          <FormControl>
                            <Input className="shad-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mb-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="shad-form_label">Email</FormLabel>
                          <FormControl>
                            <Input className="shad-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mb-3">
                    <FormField
                      control={form.control}
                      name="upi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="shad-form_label">UPI ID</FormLabel>
                          <FormControl>
                            <Input className="shad-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </section>

          <section className="mt-6">
            <button
              className="bg-red font-semibold text-white px-4 py-2 rounded-md"
              onClick={(e) => handleSignOut(e)}>
              Logout
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
