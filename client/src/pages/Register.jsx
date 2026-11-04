import PageHeading from "../components/PageHeading";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { HeartHandshake, Heart, Lock, UserRound, ArrowRight } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({ fullName: "", username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await register(formData.fullName, formData.username.trim(), formData.password);
      toast.success("Account created. Please sign in.");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout registration>
      <div className="auth-heading-icon"><HeartHandshake size={26} strokeWidth={1.6} /></div>
      <PageHeading eyebrow="JOIN US" title="Let's begin." description="A little space for your work." />
      <form onSubmit={handleSubmit} className="auth-form" aria-busy={submitting}>
        <AuthField id="register-name" label="Full name" icon={UserRound} name="fullName" type="text" autoComplete="name" placeholder="Enter your full name" value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} required />
        <AuthField id="register-username" label="Username" icon={UserRound} name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Choose a username" pattern="[A-Za-z0-9_.\-]{3,50}" title="Use 3–50 letters, numbers, dots, underscores, or hyphens" minLength={3} maxLength={50} hint="3–50 characters. Letters, numbers, dots, underscores, or hyphens." value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} required />
        <AuthField id="register-password" label="Password" icon={Lock} name="password" type="password" autoComplete="new-password" placeholder="Choose a password" minLength={12} maxLength={72} hint="At least 12 characters; up to 72 UTF-8 bytes." value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required />
        <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}<ArrowRight size={18} /></button>
      </form>
      <div className="auth-heart-divider" aria-hidden="true"><span /><Heart size={18} /><span /></div>
      <p className="auth-switch">Already have an account? <Link to="/">Sign in <ArrowRight size={14} /></Link></p>
    </AuthLayout>
  );
}
