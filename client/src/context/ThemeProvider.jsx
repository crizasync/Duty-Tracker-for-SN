import { useContext, useLayoutEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { accentTextColor, isThemeColor, lastThemeKey, readTheme, ThemeContext } from "./theme";

export default function ThemeProvider({ children }) {
  const { user } = useContext(AuthContext);
  const storageKey = user?.id ? `duty-tracker:theme:${user.id}` : lastThemeKey;
  return <ThemeSession key={storageKey} storageKey={storageKey}>{children}</ThemeSession>;
}

function ThemeSession({ storageKey, children }) {
  const [theme, setColor] = useState(() => readTheme(storageKey));

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = "custom";
    document.documentElement.style.setProperty("--theme-accent", theme);
    document.documentElement.style.setProperty("--theme-on-accent", accentTextColor(theme));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme);
    try {
      localStorage.setItem(lastThemeKey, theme);
    } catch {
      // Theme changes still work when browser storage is unavailable.
    }
  }, [theme]);

  const setTheme = (nextTheme) => {
    if (!isThemeColor(nextTheme)) return;
    nextTheme = nextTheme.toLowerCase();
    setColor(nextTheme);
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Keep the selected theme for this session when browser storage is unavailable.
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
