import {
  AlertCircle,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "../api/adminApi";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginApi(form);
      const { token, data } = res.data;
      login(token, data);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-green/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <LayoutDashboard size={32} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            FindMyParking
          </h1>
          <p className="text-on-surface-muted mt-1 text-sm">
            Admin Control Center
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="font-display text-xl font-semibold text-on-surface mb-6">
            Sign in to continue
          </h2>

          {error && (
            <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl p-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-on-surface-muted text-sm mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-muted"
                />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="admin@findmyparking.com"
                  className="w-full bg-surface-low border border-surface-border rounded-xl pl-10 pr-4 py-3 text-on-surface placeholder-on-surface-muted/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-on-surface-muted text-sm mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-muted"
                />
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="w-full bg-surface-low border border-surface-border rounded-xl pl-10 pr-4 py-3 text-on-surface placeholder-on-surface-muted/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition text-sm"
                />
              </div>
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-on-surface-muted/50 text-xs mt-6">
          © 2025 FindMyParking · Admin Panel v1.0
        </p>
      </div>
    </div>
  );
}
