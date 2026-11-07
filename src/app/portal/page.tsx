import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/portal/SubmitButton";
import { Turnstile } from "@/components/Turnstile";
import { CAPTCHA_FIELD, verifyCaptcha } from "@/lib/captcha";

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";

    if (!(await verifyCaptcha(formData.get(CAPTCHA_FIELD)))) {
      redirect("/portal?error=captcha");
    }

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/admin",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/portal?error=1");
      }
      throw error;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Sign In</h1>

        {error && (
          <p className="text-sm text-destructive">
            {error === "captcha"
              ? "We couldn't confirm you're not a bot. Please try again."
              : "Invalid email or password."}
          </p>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input id="password" name="password" type="password" required />
        </div>

        <Turnstile />

        <SubmitButton />
      </form>
    </div>
  );
}
