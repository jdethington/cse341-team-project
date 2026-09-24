//src/controllers/auth.js
// Handlers for the foundation "session check" routes. The authentication and
// role guards themselves live in src/middleware/auth.js and run before these.

// Returns the signed-in user for the current session (API).
export const getSessionUser = (req, res) => {
    return res.status(200).json({ user: req.user });
};

// Confirms an admin can reach a protected API route.
export const adminApiAccess = (req, res) => {
    return res.status(200).json({ message: "Admin access granted" });
};

// Renders a simple account page for a signed-in user.
export const accountPage = (req, res) => {
    return res.render("account", { title: "Account", user: req.user });
};

// Renders the same account page for an admin (demonstrates requirePageRole).
export const accountAdminPage = (req, res) => {
    return res.render("account", { title: "Account (admin)", user: req.user });
};
