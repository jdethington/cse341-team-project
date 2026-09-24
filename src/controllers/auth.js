//src/controllers/auth.js
// Handlers for the foundation "session check" routes plus the visible
// register/login/logout flow and the admin dashboard. The authentication and
// role guards themselves live in src/middleware/auth.js and run before these.

import {
    createUser,
    emailExists,
    findUser,
    usernameExists,
    verifyPassword,
} from "../models/auth.js";

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

// Stores the signed-in user in the session (display fields + role only — never the hash).
const signIn = (req, user) => {
    req.session.user = {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        role: user.role.name,
    };
};

// Re-renders the registration form with a validation error (the error is
// surfaced via flash, so it survives any redirect).
const reRenderRegister = (req, res, message, values) => {
    req.flash("error", message);
    return res.status(400).render("register", {
        title: "Create account",
        values,
    });
};

// Practical email format check (local@domain.tld). The browser hint is UX only —
// this is what actually guards the server side.
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());

// Re-renders the login form with an error message (surfaced via flash).
const reRenderLogin = (req, res, message) => {
    req.flash("error", message);
    return res.status(401).render("login", { title: "Sign in" });
};

// Renders the registration form (GET /register).
export const registerPage = (req, res) => {
    return res.render("register", {
        title: "Create account",
        values: { name: "", username: "", email: "" },
    });
};

// Creates a new customer account (POST /register).
export async function processRegistration(req, res, next) {
    const { name, username, email, password, confirmPassword } = req.body;
    const values = { name: name || "", username: username || "", email: email || "" };
    const isBlank = (value) => !value || String(value).trim() === "";

    if (isBlank(name) || isBlank(username) || isBlank(email) || isBlank(password) || isBlank(confirmPassword)) {
        return reRenderRegister(req, res, "Please fill in every field.", values);
    }

    if (!isValidEmail(email)) {
        return reRenderRegister(req, res, "Please enter a valid email address.", values);
    }

    if (String(password).length < 8) {
        return reRenderRegister(req, res, "Password must be at least 8 characters long.", values);
    }

    if (String(password) !== String(confirmPassword)) {
        return reRenderRegister(req, res, "Passwords do not match.", values);
    }

    try {
        if (await usernameExists(String(username).trim().toLowerCase())) {
            return reRenderRegister(req, res, "That username is already taken.", values);
        }

        if (await emailExists(String(email).trim().toLowerCase())) {
            return reRenderRegister(req, res, "An account with that email already exists.", values);
        }

        await createUser(String(name).trim(), String(username).trim(), String(email).trim(), String(password));
    } catch (error) {
        // A race between the check above and the insert surfaces as a duplicate-key error.
        if (error && error.code === 11000) {
            return reRenderRegister(req, res, "That username or email is already taken.", values);
        }
        return next(error);
    }

    req.flash("success", "Account created. Sign in to continue.");
    return res.redirect("/login");
}

// Renders the login form (GET /login).
export const loginPage = (req, res) => {
    return res.render("login", { title: "Sign in" });
};

// Verifies credentials and stores the user in the session (POST /login).
export async function processLogin(req, res, next) {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return reRenderLogin(req, res, "Please enter your username or email and your password.");
    }

    try {
        const user = await findUser(identifier);
        const valid = user && (await verifyPassword(password, user.passwordHash));

        if (!valid) {
            return reRenderLogin(req, res, "Invalid username or password. Please try again.");
        }

        signIn(req, user);

        return res.redirect(user.role.name === "admin" ? "/admin/dashboard" : "/");
    } catch (error) {
        return next(error);
    }
}

// Clears the session and signs the user out (POST /logout).
export const processLogout = (req, res) => {
    if (req.session.user) {
        delete req.session.user;
    }

    req.flash("success", "You have logged out.");
    res.clearCookie("connect.sid");
    return res.redirect("/");
};

// Renders the admin dashboard (guarded by requirePageLogin + requirePageRole("admin")).
export const adminDashboard = (req, res) => {
    return res.render("admin/dashboard", {
        title: "Admin Dashboard",
        user: req.user,
    });
};
