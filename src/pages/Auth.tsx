import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InstallPrompt } from "@/components/InstallPrompt";

type AuthMode = "login" | "signup" | "forgot" | "phone";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", phone: "", otp: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return password.length >= 8 && hasLetter && hasNumber;
  };

  const validatePhone = (phone: string) => {
    const regex = /^\+?[1-9]\d{9,14}$/;
    return regex.test(phone.replace(/\s/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (mode === "phone") {
      if (!validatePhone(form.phone)) {
        newErrors.phone = "Enter valid phone with country code (e.g., +919876543210)";
      }
    } else {
      if (!validateEmail(form.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (mode !== "forgot" && mode !== "phone") {
      if (!validatePassword(form.password)) {
        newErrors.password = "Password must be 8+ chars with at least 1 letter and 1 number";
      }

      if (mode === "signup" && form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      if (mode === "phone") {
        if (!otpSent) {
          const { error } = await supabase.auth.signInWithOtp({
            phone: form.phone,
          });

          if (error) {
            toast({ title: error.message, variant: "destructive" });
            return;
          }

          setOtpSent(true);
          toast({ title: "OTP sent to your phone!" });
          return;
        } else {
          const { error } = await supabase.auth.verifyOtp({
            phone: form.phone,
            token: form.otp,
            type: "sms",
          });

          if (error) {
            toast({ title: error.message, variant: "destructive" });
            return;
          }

          toast({ title: "Welcome!" });
          return;
        }
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) {
          toast({ title: error.message, variant: "destructive" });
          return;
        }

        toast({ 
          title: "Reset link sent!", 
          description: "Check your email for password reset instructions." 
        });
        setMode("login");
        return;
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({ title: "Invalid email or password", variant: "destructive" });
          } else {
            toast({ title: error.message, variant: "destructive" });
          }
          return;
        }

        toast({ title: "Welcome back!" });
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "This email is already registered. Try signing in.", variant: "destructive" });
          } else {
            toast({ title: error.message, variant: "destructive" });
          }
          return;
        }

        toast({ title: "Account created successfully!" });
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({ title: error.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast({ title: "Failed to sign in with Google", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome Back";
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      case "phone": return "Phone Login";
    }
  };

  const getTagline = () => {
    switch (mode) {
      case "login": return "Sign in to find your optimal journey";
      case "signup": return "Join thousands of smart travelers";
      case "forgot": return "We'll send you a reset link";
      case "phone": return "Login with OTP verification";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <InstallPrompt />
      
      <div className="header-gradient p-6 pb-20 flex-shrink-0">
        <div className="flex justify-center pt-8 animate-float">
          <Logo size="lg" />
        </div>
        <p className="text-primary-foreground/80 text-center mt-3 text-sm animate-slide-up">
          Smart seat-stitching for Indian Railways
        </p>
        
        {/* Feature badges */}
        <div className="flex justify-center gap-2 mt-4 animate-slide-up delay-200">
          <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium backdrop-blur-sm">
            🚄 Pan-India
          </span>
          <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium backdrop-blur-sm">
            ⚡ Real-time
          </span>
        </div>
      </div>

      <div className="flex-1 -mt-12 px-4 pb-8">
        <div className="glass-card p-6 max-w-md mx-auto animate-scale-in">
          <h2 className="text-2xl font-bold text-foreground text-center mb-1">
            {getTitle()}
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            {getTagline()}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "phone" ? (
              <>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      className="pl-10"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={otpSent}
                    />
                  </div>
                  {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                </div>

                {otpSent && (
                  <div>
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={form.otp}
                      onChange={(e) => setForm({ ...form, otp: e.target.value })}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>

                {mode !== "forgot" && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
                  </div>
                )}

                {mode === "signup" && (
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {mode === "login" && (
                  <div className="text-right">
                    <button 
                      type="button" 
                      onClick={() => setMode("forgot")} 
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : 
                mode === "forgot" ? "Send Reset Link" : 
                mode === "phone" ? (otpSent ? "Verify OTP" : "Send OTP") :
                mode === "login" ? "Sign In" : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Social login divider */}
          {(mode === "login" || mode === "signup") && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMode("phone");
                    setOtpSent(false);
                    setForm({ ...form, phone: "", otp: "" });
                  }}
                  disabled={loading}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Phone
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-muted-foreground text-sm mt-6">
            {mode === "login" && (
              <>
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-semibold">
                  Sign Up
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-semibold">
                  Sign In
                </button>
              </>
            )}
            {(mode === "forgot" || mode === "phone") && (
              <>
                Back to{" "}
                <button onClick={() => { setMode("login"); setOtpSent(false); }} className="text-primary font-semibold">
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-6 max-w-md mx-auto grid grid-cols-3 gap-3 animate-slide-up delay-300">
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">🚄</span>
            </div>
            <p className="text-xs font-medium text-foreground">All Trains</p>
            <p className="text-xs text-muted-foreground">Pan-India</p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">⚡</span>
            </div>
            <p className="text-xs font-medium text-foreground">Fast</p>
            <p className="text-xs text-muted-foreground">Real-time</p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">✅</span>
            </div>
            <p className="text-xs font-medium text-foreground">Optimal</p>
            <p className="text-xs text-muted-foreground">Min changes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
