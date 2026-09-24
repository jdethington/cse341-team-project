//src/middleware/auth.js
// Session-based authentication and role guards.
// loadSessionUser is a loader (not a guard); the require* functions are guards.

// Copies the session user to req.user for handlers and res.locals.user for EJS templates.
export const loadSessionUser = (req, res, next) => {
    req.user = req.session?.user || null;
    res.locals.user = req.user;
    return next();
};

const isLoggedIn = (req) => {
    return Boolean(req.user);
};

const hasRole = (req, role) => {
    return req.user.role === role;
};

// API guard: 401 JSON if not authenticated.
export const requireApiLogin = (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: "Authentication required" });
    }
    return next();
};

// Page guard: redirect to the login page if not authenticated.
export const requirePageLogin = (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.redirect("/login");
    }
    return next();
};

// API role guard: 401 JSON if not authenticated, 403 JSON if the role does not match.
export const requireApiRole = (role) => (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: "Authentication required" });
    }
    if (!hasRole(req, role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    return next();
};

// Page role guard: redirect to the login page if not authenticated,
// render the 403 page if the role does not match.
export const requirePageRole = (role) => (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.redirect("/login");
    }
    if (!hasRole(req, role)) {
        return res.status(403).render("errors/403", {
            title: "Forbidden",
            message: "You do not have permission to view this page.",
        });
    }
    return next();
};
