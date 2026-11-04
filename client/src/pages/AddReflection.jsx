import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookHeart, CalendarDays, Heart, Save, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import MenuBar from "../components/MenuBar";
import PageHeading from "../components/PageHeading";
import { createReflection } from "../services/reflection";

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AddReflection() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ dutyDate: today(), title: "", content: "" }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const words = form.content.trim().split(/\s+/).filter(Boolean).length;
  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const saveReflection = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.title.trim() || !form.content.trim()) {
      setError("Add a title and a few thoughts before saving.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createReflection({ ...form, title: form.title.trim(), content: form.content.trim() });
      toast.success("Reflection saved!");
      navigate("/reflections", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Your reflection couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-page reflection-editor-page min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <MenuBar />
        <Link to="/reflections" className="reflection-back"><ArrowLeft size={17} /> Your journal</Link>
        <section className="reflection-editor-heading rounded-3xl border border-pink-200 bg-white p-6">
          <PageHeading eyebrow="REFLECTIONS" title="A moment for you" description="Little thoughts. Meaningful growth." />
        </section>
        <section className="reflection-editor-card rounded-3xl border border-pink-200 bg-white p-6" aria-labelledby="reflection-form-title">
          <div className="reflection-editor-intro"><span><BookHeart size={24} /></span><div><h2 id="reflection-form-title">Your new reflection</h2><p>Capture a moment from your day.</p></div><Sparkles size={20} aria-hidden="true" /></div>
          <form onSubmit={saveReflection} className="reflection-editor-form" aria-busy={saving}>
            <fieldset disabled={saving}>
              <div className="reflection-editor-fields">
                <label htmlFor="reflection-date"><span><CalendarDays size={15} /> Duty date</span><input id="reflection-date" name="dutyDate" type="date" value={form.dutyDate} onChange={updateField} required /></label>
                <label htmlFor="reflection-title"><span>A little title</span><input id="reflection-title" name="title" type="text" placeholder="What stayed with you?" value={form.title} onChange={updateField} required /></label>
              </div>
              <label className="reflection-content-label" htmlFor="reflection-content"><span>Your thoughts</span><textarea id="reflection-content" name="content" placeholder="What happened? What did you learn? How did you feel?" value={form.content} onChange={updateField} aria-describedby="reflection-writing-hint" required /></label>
              <div className="reflection-writing-footer" id="reflection-writing-hint"><span><Heart size={14} /> Every little thought counts.</span><span>{words} {words === 1 ? "word" : "words"}</span></div>
              {error && <p className="reflection-save-error" role="alert">{error}</p>}
              <div className="reflection-editor-actions"><Link to="/reflections">Cancel</Link><button type="submit" className="text-white"><Save size={17} />{saving ? "Saving..." : "Save reflection"}</button></div>
            </fieldset>
          </form>
        </section>
      </div>
    </div>
  );
}
