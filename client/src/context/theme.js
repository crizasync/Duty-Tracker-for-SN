import { createContext, useContext } from "react";

export const defaultColor = "#548333";
export const lastThemeKey = "duty-tracker:theme:last";
const legacyColors = { rose: defaultColor, ocean: "#0369a1", sage: "#047857", lavender: "#7c3aed" };
export const isThemeColor = (color) => /^#[0-9a-f]{6}$/i.test(color);

export function accentTextColor(color) {
  const channels = color.slice(1).match(/../g).map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? "#111827" : "#ffffff";
}

export const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

export function readTheme(key) {
  try {
    const stored = localStorage.getItem(key) || localStorage.getItem(lastThemeKey);
    return isThemeColor(stored) ? stored.toLowerCase() : legacyColors[stored] || defaultColor;
  } catch {
    return defaultColor;
  }
}
