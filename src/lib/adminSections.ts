// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

export type AdminSection = "dashboard" | "exhibitors" | "talks" | "classes" | "floorplan" | "settings";

/** URL of each admin section; the paths stay German like the rest of the interface. */
export const ADMIN_PATHS: Record<AdminSection, string> = {
    dashboard: "/admin",
    exhibitors: "/admin/aussteller",
    talks: "/admin/vortraege",
    classes: "/admin/klassen",
    floorplan: "/admin/lageplan",
    settings: "/admin/einstellungen",
};

export function sectionForPath(pathname: string): AdminSection | null {
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const match = Object.entries(ADMIN_PATHS).find(([, path]) => path === normalized);
    return match ? match[0] as AdminSection : null;
}
