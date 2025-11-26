import { useState } from "react";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(`Failed to update password: ${error.message}`);
    } else {
      toast.success("Your password has been updated successfully! Redirecting you to the dashboard...");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0D14] text-slate-200 relative overflow-hidden p-4 font-sans">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-pink-900/05 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 mb-4 hover:border-purple-500/50 transition-all">
                <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-6 w-6 object-contain" />
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">New Credentials</h1>
            <p className="text-slate-400 text-sm">Secure your account with a fresh password.</p>
        </div>

        <Card className="bg-[#13151C]/50 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-xl font-semibold text-white">Set a New Password</CardTitle>
            <CardDescription className="text-slate-400">
                Please enter and confirm your new password below.
            </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pb-6">
                <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-xs uppercase tracking-wider font-medium">New Password</Label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10 h-12 bg-[#1A1D26] border-white/5 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-slate-500 hover:text-white" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-300 text-xs uppercase tracking-wider font-medium">Confirm New Password</Label>
                <div className="relative">
                    <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10 h-12 bg-[#1A1D26] border-white/5 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-slate-500 hover:text-white" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                </div>
            </CardContent>
            <CardFooter className="pb-8">
                <Button type="submit" className="w-full h-12 text-base bg-white text-black hover:bg-slate-200 rounded-xl font-medium transition-all" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating...</> : "Update Password"}
                </Button>
            </CardFooter>
            </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;