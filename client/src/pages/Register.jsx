import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { HeartHandshake, Lock, Mail, UserRound } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(formData.fullName, formData.email, formData.password);
      toast.success("Account created. Please sign in.");
      navigate("/");
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to create account";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_90%_10%,#ffd6e8_0%,#ffeaf2_30%,#fff5f8_70%,#fff 100%)] p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2.2rem] border border-pink-200 bg-white/80 shadow-[0_22px_70px_rgba(225,29,72,0.18)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-5">
            <div className="hidden bg-gradient-to-b from-pink-400 to-rose-400 p-8 text-white lg:col-span-2 lg:block">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                <HeartHandshake size={16} />
                Hi Nurse!
              </div>
              <h2 className="mt-7 text-3xl font-black leading-tight">
                Start Your Journey With Duty Tracker
              </h2>
              <p className="mt-4 text-white/85">
                Build your profile, log every duty, and stay organized from day
                one.
              </p>
            </div>

            <div className="p-7 sm:p-10 lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-rose-950">
                Create Account
              </h1>
              <p className="mt-2 text-sm text-rose-900/70">
                Register to unlock your personalized dashboard.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="relative">
                  <UserRound
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full rounded-xl border border-pink-200 bg-pink-50/60 py-3 pl-10 pr-4 text-rose-950 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="email@hospital.org"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-pink-200 bg-pink-50/60 py-3 pl-10 pr-4 text-rose-950 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
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
                    placeholder="Choose a password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full rounded-xl border border-pink-200 bg-pink-50/60 py-3 pl-10 pr-4 text-rose-950 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3 font-semibold text-white shadow-[0_12px_24px_rgba(236,72,153,0.35)] transition hover:brightness-105"
                >
                  Register
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-rose-900/70 lg:text-left">
                Already have an account?{" "}
                <Link
                  to="/"
                  className="font-semibold text-pink-600 hover:text-pink-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
