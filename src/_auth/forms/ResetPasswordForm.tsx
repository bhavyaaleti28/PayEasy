import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordValidation } from "@/lib/validation";
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "@/lib/react-query/queries";
import { toast } from "@/components/ui";

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId") || searchParams.get("user_id") || "";
  const secret = searchParams.get("secret") || "";

  const { mutateAsync: doReset, isLoading } = useResetPassword();

  const form = useForm<any>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (values: any) => {
    try {
      if (!userId || !secret) {
        toast({ title: "Invalid reset link" });
        return;
      }
      await doReset({ userId, secret, password: values.password });
      toast({ title: "Password reset successfully. Please log in." });
      navigate("/sign-in");
    } catch (err: any) {
      console.error(err);
      toast({ title: err?.message || "Failed to reset password" });
    }
  };

  return (
    <div className="sm:w-420 flex-center flex-col">
      <h3 style={{ color: "var(--accent)" }} className="text-2xl font-bold">
        Reset Password
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full mt-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">New Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={isLoading} style={{ backgroundColor: "var(--accent)" }}>
              {isLoading ? "Saving..." : "Reset Password"}
            </Button>
            <Button type="button" onClick={() => navigate("/sign-in")}>Back</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ResetPasswordForm;
