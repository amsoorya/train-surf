import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup" | "forgot";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (mode !== "forgot") {
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

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome Back";
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
    }
  };

  const getTagline = () => {
    switch (mode) {
      case "login": return "Sign in to find your optimal journey";
      case "signup": return "Join thousands of smart travelers";
      case "forgot": return "We'll send you a reset link";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="header-gradient p-6 pb-20 flex-shrink-0">
        <div className="flex justify-center pt-8 animate-float">
          <Logo size="lg" />
        </div>
        <p className="text-primary-foreground/80 text-center mt-3 text-sm animate-slide-up">
          Smart seat-stitching for Indian Railways
        </p>
        
        {/* Tagline badges */}
        <div className="flex justify-center gap-2 mt-4 animate-slide-up delay-200">
          <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium backdrop-blur-sm">
            <Sparkles className="w-3 h-3 inline mr-1" />
            AI-Powered
          </span>
          <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium backdrop-blur-sm">
            Instant Results
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

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "forgot" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

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
            {mode === "forgot" && (
              <>
                Remember your password?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-semibold">
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
            <p className="text-xs text-muted-foreground">Pan-India coverage</p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">⚡</span>
            </div>
            <p className="text-xs font-medium text-foreground">Instant</p>
            <p className="text-xs text-muted-foreground">Real-time results</p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">✅</span>
            </div>
            <p className="text-xs font-medium text-foreground">Optimal</p>
            <p className="text-xs text-muted-foreground">Min seat changes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
