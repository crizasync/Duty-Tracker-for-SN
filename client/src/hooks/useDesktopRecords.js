import { useSyncExternalStore } from "react";

const query = "(min-width: 1024px)";
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;
function subscribe(callback) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export default function useDesktopRecords() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
