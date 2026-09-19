import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  KeySquare,
  Mail,
  Lock,
  User,
  ArrowRight,
  Phone,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import type { RoleType } from "@/types/urbancore";
import { useAuth } from "@/contexts/AuthContext";

export function AuthModal({
  role,
  onClose,
  onSuccess,
}: {
  role: RoleType;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          full_name: name,
          phone,
          address,
          role: role === "municipal" ? "MUNICIPAL_CORP" : role?.toUpperCase(),
        });
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {role && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-background/50 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header Glow */}
            <div className="absolute left-1/2 top-0 h-32 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[60px]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative p-6 sm:p-8">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <KeySquare className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h3>
                <p className="mt-2 text-sm font-light text-muted-foreground">
                  Access the <span className="font-medium text-foreground capitalize">{role}</span>{" "}
                  Workspace
                </p>
              </div>

              <div className="mb-6 flex w-full rounded-lg bg-foreground/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    !isLogin
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    isLogin
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Login
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                    {error}
                  </div>
                )}
                {!isLogin && (
                  <>
                    <div className="group relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-light outline-none transition-colors focus:border-primary/50"
                      />
                    </div>
                    <div className="group relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-light outline-none transition-colors focus:border-primary/50"
                      />
                    </div>
                    <div className="group relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <input
                        type="text"
                        placeholder="Full Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-light outline-none transition-colors focus:border-primary/50"
                      />
                    </div>
                  </>
                )}

                <div className="group relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-light outline-none transition-colors focus:border-primary/50"
                  />
                </div>

                <div className="group relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-10 text-sm font-light outline-none transition-colors focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {isLogin && (
                  <div className="flex justify-end mt-[-8px]">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
