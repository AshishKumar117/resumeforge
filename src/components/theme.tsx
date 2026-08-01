"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("rf_theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Inline script placed in <head> to set the theme before first paint. */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("rf_theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var d=document.documentElement;if(t==="dark"){d.classList.add("dark")}}catch(e){}})();`,
      }}
    />
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync after mount; avoids SSR hydration mismatch
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("rf_theme", next);
    applyTheme(next);
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className={className} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
