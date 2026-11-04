import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthField({ label, icon: Icon, id, hint, ...props }) {
  const [visible, setVisible] = useState(false);
  const password = props.type === "password";
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <Icon aria-hidden="true" size={18} className="auth-field-icon" />
        <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} type={password && visible ? "text" : props.type} className={password ? "auth-password-input" : undefined} />
        {password && <button type="button" className="auth-password-toggle" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} aria-controls={id} onClick={() => setVisible(!visible)}>{visible ? <Eye size={19} /> : <EyeOff size={19} />}</button>}
      </div>
      {hint && <p id={`${id}-hint`} className="auth-field-hint">{hint}</p>}
    </div>
  );
}
