import { useId } from "react";

const hints = {
  "Duty date": "Choose the date of your duty shift.",
  "Hospital": "Enter the name of the hospital or clinic.",
  "Ward": "Enter your assigned ward or department.",
  "Shift": "Choose your duty shift.",
  "Time in": "Select the time your shift started.",
  "Time out": "Select the time your shift ended.",
  "Remarks": "Add any extra details about this shift.",
  "Procedure name": "Enter the clinical procedure you performed or assisted with.",
  "Status": "Choose whether the procedure is completed or pending.",
  "Frequency": "Enter how many times you performed this procedure.",
  "Date performed": "Choose the date the procedure was performed.",
  "Notes": "Add observations or details about the procedure.",
  "Reflection title": "Give your reflection a short, descriptive title.",
  "Reflection content": "Describe the experience, what you learned, and how you felt.",
};

export default function ModalField({ as: Control = "input", label, hint = hints[label], className = "", children, ...props }) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const wide = className.includes("md:col-span-2");
  return (
    <div className={`modal-form-field ${wide ? "md:col-span-2" : ""}`}>
      <label className="modal-field-label" htmlFor={id}>{label}<span>{props.required ? "Required" : "Optional"}</span></label>
      <Control {...props} id={id} aria-label={label} aria-describedby={hint ? `${id}-hint` : undefined} className={className.replace(/\bmd:col-span-2\b/g, "")}>
        {children}
      </Control>
      {hint && <p className="modal-field-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}
