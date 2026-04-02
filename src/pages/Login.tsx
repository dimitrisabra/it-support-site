import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Mail, Lock, Eye, EyeOff, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const finishLogin = () => {
    toast({ title: "Welcome back!", description: "Signed in successfully" });
    setTimeout(() => {
      if (email.toLowerCase().includes("admin")) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      setLoading(false);
    }, 300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    if (!error) {
      finishLogin();
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isDemoEmail = normalizedEmail === "user@example.com" || normalizedEmail === "admin@example.com";
    const isInvalidCredentials = /invalid login credentials/i.test(error.message ?? "");

    if (isDemoEmail && isInvalidCredentials) {
      const demoName = normalizedEmail.includes("admin") ? "Admin Demo" : "User Demo";
      const signupAttempt = await signUp(normalizedEmail, password, demoName);
      if (!signupAttempt.error) {
        const retry = await signIn(normalizedEmail, password);
        if (!retry.error) {
          finishLogin();
          return;
        }
      }
    }

    toast({
      title: "Login failed",
      description: isInvalidCredentials ? "No account found. Please sign up first (or use the demo buttons)." : error.message,
      variant: "destructive",
    });
    setLoading(false);
  };

  const fillDemo = (type: "user" | "admin") => {
    setEmail(type === "user" ? "user@example.com" : "admin@example.com");
    setPassword(type === "user" ? "user1234" : "admin1234");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative z-10 max-w-md text-center p-12">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to access your AI-powered support platform.</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-primary mb-2" />
              <h3 className="text-sm font-semibold text-foreground">AI-Powered</h3>
              <p className="text-xs text-muted-foreground mt-1">Real-time streaming AI responses</p>
            </div>
            <div className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-success mb-2" />
              <h3 className="text-sm font-semibold text-foreground">Secure</h3>
              <p className="text-xs text-muted-foreground mt-1">End-to-end encrypted chats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">SupportAI</span>
          </div>

          <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Sign in</h1>
          <p className="text-muted-foreground text-sm mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-secondary border-border focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>

          <div className="mt-6 space-y-2">
            <p className="text-xs text-muted-foreground text-center font-medium">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo("user")}
                className="text-xs border-border hover:border-primary hover:text-primary"
              >
                <Zap className="h-3 w-3 mr-1" /> User Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo("admin")}
                className="text-xs border-border hover:border-primary hover:text-primary"
              >
                <Shield className="h-3 w-3 mr-1" /> Admin Demo
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Sign up first with these emails, then log in. Passwords: user1234 / admin1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
