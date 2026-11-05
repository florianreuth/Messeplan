// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { defineMiddleware } from "astro:middleware";

const LOGIN_PAGE = "/admin/login";

// Admin pages redirect to the login; admin actions and the backup download check the session themselves
export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;
    const adminArea = pathname === "/admin" || pathname.startsWith("/admin/");
    context.locals.isAdmin = adminArea && await context.session?.get("admin") === true;

    if (adminArea && pathname !== LOGIN_PAGE && !context.locals.isAdmin) {
        return context.redirect(`${LOGIN_PAGE}?next=${encodeURIComponent(pathname)}`);
    }
    return next();
});
