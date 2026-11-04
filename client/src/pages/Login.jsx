import PageHeading from "../components/PageHeading";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Heart, Lock, UserRound, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(formData.username.trim(), formData.password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.status === 429 ? "Too many sign-in attempts. Please try again later." : "Invalid username or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-heading-icon"><Heart size={26} strokeWidth={1.6} /><span aria-hidden="true" className="auth-icon-dot" /></div>
      <PageHeading eyebrow="WELCOME" title="Hello again." description="Your day starts here." />
      <form onSubmit={handleSubmit} className="auth-form" aria-busy={submitting}>
        <AuthField id="login-username" label="Username" icon={UserRound} name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Enter your username" value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} required />
        <AuthField id="login-password" label="Password" icon={Lock} name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required />
        <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}<ArrowRight size={18} /></button>
      </form>
      <div className="auth-heart-divider" aria-hidden="true"><span /><Heart size={17} /><span /></div>
      <p className="auth-divider-caption">A little space, just for you</p>
      <p className="auth-switch">New here? <Link to="/register">Create an account <ArrowRight size={14} /></Link></p>
    </AuthLayout>
  );
}
