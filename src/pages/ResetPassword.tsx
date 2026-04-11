import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowRight, GraduationCap, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const authRedirectBaseUrl = (import.meta.env.VITE_AUTH_REDIRECT_BASE_URL || window.location.origin).replace(/\/$/, "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidReason, setInvalidReason] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }

    if (hash.includes("error=")) {
      const fragment = new URLSearchParams(hash.replace(/^#/, ""));
      const errorDescription = fragment.get("error_description") || "Reset link is invalid or expired.";
      const cleanDescription = errorDescription.replace(/\+/g, " ");
      setInvalidReason(cleanDescription);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.endsWith("@student.egerton.ac.ke")) {
      toast.error("Please use your @student.egerton.ac.ke email address");
      return;
    }

    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown}s before requesting another link.`);
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${authRedirectBaseUrl}/reset-password`,
      });
      if (error) throw error;

      setResendCooldown(60);
      toast.success("A new reset link has been sent. Use the latest email.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send reset link");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <GraduationCap className="h-10 w-10 text-primary mx-auto" />
            <CardTitle className="text-2xl">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Request a new one below.
            </CardDescription>
            {invalidReason && (
              <p className="text-xs text-muted-foreground">Reason: {invalidReason}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestNewLink} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="reset-email">University Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="njuguna.0299123@student.egerton.ac.ke"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={resendLoading || resendCooldown > 0}>
                {resendLoading
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Request again in ${resendCooldown}s`
                  : "Request New Reset Link"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/auth")}> 
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md border-0 shadow-xl animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <GraduationCap className="h-10 w-10 text-primary mx-auto" />
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  Update Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}