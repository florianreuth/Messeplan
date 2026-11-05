// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

export const THEME_KEY = "messeplan-theme";
export const THEME_COLORS = { light: "#1a2947", dark: "#171717" } as const;

/** Applies the theme to the document. The initial theme is set by the inline script in `Base.astro`. */
export function applyTheme(dark: boolean): void {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    // color-scheme also themes native controls such as selects and scrollbars
    root.style.colorScheme = dark ? "dark" : "light";
    document.querySelector("meta[name=\"theme-color\"]")?.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

/** Switches between light and dark and remembers the choice, overriding the system preference. */
export function toggleTheme(): void {
    const dark = !document.documentElement.classList.contains("dark");
    applyTheme(dark);
    try {
        localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
        // Storage can be blocked; the theme then only lasts for this page view
    }
}
