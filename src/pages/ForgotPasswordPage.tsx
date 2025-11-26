import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground relative overflow-hidden p-4 font-sans">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/20 border border-border mb-4 hover:border-primary/50 transition-all">
                <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-6 w-6 object-contain" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-2">Recovery</h1>
            <p className="text-muted-foreground text-sm">We'll help you get back in.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">Forgot Password</CardTitle>
            <CardDescription className="text-muted-foreground">
                {submitted
                ? "Check your inbox for the reset link."
                : "Enter your email and we'll send you a link to reset your password."}
            </CardDescription>
            </CardHeader>
            {submitted ? (
            <CardContent className="pb-8">
                <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                <p className="text-sm">A password reset link has been sent to <strong className="text-green-300">{email}</strong>. Please check your email to continue.</p>
                </div>
            </CardContent>
            ) : (
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pb-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Email Address</Label>
                    <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10 h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 rounded-xl"
                    />
                    </div>
                </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pb-8">
                <Button type="submit" className="w-full h-12 text-base rounded-xl font-medium transition-all" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
                </Button>
                </CardFooter>
            </form>
            )}
            <div className="border-t border-border bg-muted/30 p-4 text-center">
                <Button variant="link" asChild className="text-muted-foreground hover:text-foreground text-sm">
                    <Link to="/login" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;