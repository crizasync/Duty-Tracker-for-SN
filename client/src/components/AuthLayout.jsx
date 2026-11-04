import { Heart, Sparkles, ClipboardCheck, NotebookPen, Stethoscope, Check, Sun, Flower2, Sprout } from "lucide-react";
import ThemePicker from "./ThemePicker";
import HeadingCat from "./HeadingCat";

export default function AuthLayout({ children, registration = false }) {
  return (
    <main className={`auth-layout ${registration ? "auth-registration" : "auth-login"}`}>
      <aside className="auth-story">
        <a href="/" className="auth-brand" aria-label="Duty-Tracker home">
          <span className="brand-mark"><Heart size={25} /><Sparkles size={12} className="brand-sparkle" /></span>
          <span><strong className="brand-name">Duty-Tracker</strong><span className="brand-tagline block">Your care, organized</span></span>
        </a>
        <div className="auth-story-content">
          <p className="eyebrow"><Sparkles size={15} /> Made for people who care</p>
          <h2>{registration ? "Make room for your next chapter." : <>A little order.<br /><span className="auth-title-accent">A lot of care.<svg viewBox="0 0 320 18" fill="none" aria-hidden="true"><path d="M4 12C86 1 224 1 315 11M50 16C129 9 212 8 274 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></span></>}</h2>
          <p className="auth-story-description">Your shifts, clinical milestones, and daily reflections. Together in one thoughtful workspace.</p>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-desk-scene">
              <span className="desk-orbit" /><span className="desk-orbit second" />
              <span className="desk-sparkle one"><Sparkles size={24} /></span><span className="desk-sparkle two"><Sparkles size={15} /></span>
              <div className="desk-notebook">
                <span className="notebook-binding" />
                <div className="notebook-heading"><span><Sun size={15} /> A fresh start</span><Heart size={16} /></div>
                <strong>A little more<br />organized.</strong>
                <p>Your day, one step at a time.</p>
                <div className="notebook-task"><span><Check size={13} /></span> Log your shift <span className="notebook-task-dot" /></div>
                <div className="notebook-task"><span><Check size={13} /></span> Celebrate a milestone <span className="notebook-task-dot" /></div>
                <div className="notebook-task"><span className="task-open" /> Make time to reflect <span className="notebook-task-dot" /></div>
                <div className="notebook-footer"><span /><Flower2 size={22} /><span /></div>
              </div>
              <div className="desk-care-badge"><span><Stethoscope size={22} /></span><div><strong>Made for your journey</strong><small>A little support, every shift.</small></div><Heart size={14} /></div>
              <div className="desk-flower"><Flower2 size={43} strokeWidth={1.3} /></div>
              <span className="desk-caption">a space to grow, at your own pace</span>
            </div>
          </div>
          <div className="auth-highlights">
            <span><ClipboardCheck size={17} /> Keep every shift in order</span>
            <span><NotebookPen size={17} /> See how far you’ve grown</span>
          </div>
        </div>
        <p className="auth-story-footer"><Heart size={13} /> Small steps. Meaningful progress.</p>
      </aside>
      <section className="auth-form-panel" aria-label={registration ? "Create your account" : "Sign in to your account"}>
        <div className="auth-toolbar"><span className="auth-mobile-brand"><Heart size={18} /> Duty-Tracker</span><ThemePicker /></div>
        <div className="auth-form-content"><div className="auth-mascot" aria-hidden="true"><HeadingCat /><Heart className="auth-mascot-heart" size={18} /><Sparkles className="auth-mascot-sparkles" size={18} /></div>{!registration && <span className="auth-card-sparkle" aria-hidden="true"><Sparkles size={22} /></span>}{children}</div>
        <p className="auth-form-footer"><Sprout size={24} aria-hidden="true" />A thoughtful space for the work you do.</p>
      </section>
    </main>
  );
}
