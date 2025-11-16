import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { useSendPasswordRecovery } from "@/lib/react-query/queries";
import { toast } from "@/components/ui";

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const { mutateAsync: sendRecovery, isLoading } = useSendPasswordRecovery();

  const form = useForm({
    resolver: zodResolver(z.object({ email: z.string().email() })),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: any) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      await sendRecovery({ email: values.email, redirectUrl });
      toast({ title: "Recovery email sent. Check your inbox." });
      navigate("/sign-in");
    } catch (err: any) {
      console.error(err);
      toast({ title: err?.message || "Failed to send recovery email" });
    }
  };

  return (
    <div className="sm:w-420 flex-center flex-col">
      <h3 style={{ color: "var(--accent)" }} className="text-2xl font-bold">
        Forgot Password
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full mt-4">
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

          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={isLoading} style={{ backgroundColor: "var(--accent)" }}>
              {isLoading ? "Sending..." : "Send Recovery Email"}
            </Button>
            <Button type="button" onClick={() => navigate("/sign-in")}>Back</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ForgotPasswordForm;
