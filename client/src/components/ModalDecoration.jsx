import { Heart, Sparkles } from "lucide-react";
import HeadingCat from "./HeadingCat";

export default function ModalDecoration() {
  return <div className="modal-decoration" aria-hidden="true"><Sparkles className="modal-sparkles" size={17} /><Heart className="modal-heart" size={14} /><HeadingCat /></div>;
}
