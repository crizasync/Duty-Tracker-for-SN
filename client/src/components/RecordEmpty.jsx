import { ClipboardCheck, Heart } from "lucide-react";

export default function RecordEmpty({ children }) {
  return <div className="record-empty col-span-full" role="status"><span className="record-empty-art"><ClipboardCheck size={48} strokeWidth={1.4} /><Heart size={14} /></span><p>{children}</p></div>;
}
