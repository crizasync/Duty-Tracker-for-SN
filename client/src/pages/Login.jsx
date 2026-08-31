import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Heart, Lock, Mail, Sparkles } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#ffe7ef_0%,#ffd6e7_32%,#ffc5dd_60%,#fff0f5_100%)] p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.4rem] border border-pink-200 bg-white/75 shadow-[0_25px_80px_rgba(190,24,93,0.18)] backdrop-blur-xl lg:grid-cols-2">
          <div className="relative hidden p-10 lg:block">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-pink-200/70 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-rose-300/50 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-300 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700">
                  <Sparkles size={16} />
                  Soft Care Portal
                </div>
                <h2 className="max-w-sm text-4xl font-black leading-tight text-rose-950">
                  Duty Tracker For Calm, Caring Teams
                </h2>
                <p className="mt-4 max-w-sm text-rose-900/80">
                  Track procedures, reflect daily, and keep your records ready
                  in one elegant workspace.
                </p>
              </div>
              <div className="rounded-3xl border border-pink-200 bg-white/80 p-5">
                <p className="text-sm font-semibold text-rose-900">
                  "A gentle interface with serious clinical power."
                </p>
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-700 lg:mx-0">
                <Heart size={27} />
              </div>
              <h1 className="text-3xl font-extrabold text-rose-950">
                Welcome Back
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400"
                  size={18}
                />
                <input
                  type="email"
                  className="w-full rounded-xl border border-pink-200 bg-pink-50/50 py-3 pl-10 pr-4 text-rose-950 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
                  placeholder="email@hospital.org"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400"
                  size={18}
                />
                <input
                  type="password"
                  className="w-full rounded-xl border border-pink-200 bg-pink-50/50 py-3 pl-10 pr-4 text-rose-950 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3 font-semibold text-white shadow-[0_10px_25px_rgba(236,72,153,0.35)] transition hover:brightness-105 active:scale-[0.99]"
              >
                Sign In
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-rose-900/70 lg:text-left">
              New here?{" "}
              <Link
                to="/register"
                className="font-semibold text-pink-600 hover:text-pink-700"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
