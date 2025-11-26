import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Lock, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        navigate("/forgot-password");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully! You can now login.");
      navigate("/login");
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
            <p className="text-muted-foreground text-sm">Create a new password for your account.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">New Password</CardTitle>
            <CardDescription className="text-muted-foreground">
                Enter your new password below.
            </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pb-6">
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider font-medium">New Password</Label>
                    <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                        className="pl-10 pr-10 h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 rounded-xl"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    </div>
                </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pb-8">
                <Button type="submit" className="w-full h-12 text-base rounded-xl font-medium transition-all" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
                </Button>
                </CardFooter>
            </form>
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

export default ResetPasswordPage;