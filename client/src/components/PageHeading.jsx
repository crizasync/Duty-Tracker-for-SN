import { Clipboard, Heart } from "lucide-react";
import HeadingCat from "./HeadingCat";

export default function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div className="page-heading-copy">
        <p className="page-heading-eyebrow"><Clipboard size={13} />{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-heading-description">{description}</p>
      </div>
      <HeadingCat />
      <Heart className="heading-heart" size={18} aria-hidden="true" />
      {children && <div className="page-heading-actions">{children}</div>}
    </div>
  );
}
