import { Palette } from "lucide-react";
import { useTheme } from "../context/theme";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-sm font-semibold text-pink-700">
      <Palette size={16} aria-hidden="true" />
      <span>Theme</span>
      <input
        type="color"
        aria-label="Color theme"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        title="Choose any theme color"
        className="h-8 w-10 cursor-pointer rounded border border-pink-200 bg-white p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
      />
    </label>
  );
}
