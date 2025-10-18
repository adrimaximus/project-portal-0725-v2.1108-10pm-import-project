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
import { Mail, Loader2, Package, ArrowLeft } from "lucide-react";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2940&auto=format&fit=crop')"}}>
      <Card className="w-full max-w-sm bg-black/50 backdrop-blur-md border-gray-700 text-white">
        <CardHeader className="text-center">
          <div className="flex flex-col justify-center items-center gap-2 mb-2">
            <Package className="h-8 w-8 text-white" />
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            {submitted
              ? "Check your inbox for the reset link."
              : "Enter your email and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        {submitted ? (
          <CardContent>
            <div className="text-center p-4 bg-green-500/20 rounded-lg">
              <p>A password reset link has been sent to <strong>{email}</strong>. Please check your email to continue.</p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter>
            <Button variant="link" asChild className="text-gray-400 hover:text-white w-full">
                <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;