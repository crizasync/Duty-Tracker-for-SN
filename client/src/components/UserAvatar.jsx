import { useState } from "react";
import { getAvatarUrl } from "../utils/avatar";

export default function UserAvatar({ user }) {
  const src = getAvatarUrl(user?.avatar_url);
  const [failedSrc, setFailedSrc] = useState(null);
  if (src && failedSrc !== src) return <img src={src} alt="" className="user-avatar-image" onError={() => setFailedSrc(src)} />;
  return (user?.full_name || "C").split(" ").filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase();
}
