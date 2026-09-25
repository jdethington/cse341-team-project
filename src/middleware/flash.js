//src/middleware/flash.js
// Flash message middleware.
//
// Provides temporary message storage that survives a redirect but is consumed
// on render. Messages live in the session and are organized by type
// (success, error, warning, info).
//
// Usage in controllers:
//   req.flash('success', 'Message text')  // store a message
//   req.flash('error')                    // retrieve + clear error messages
//   req.flash()                           // retrieve + clear all messages
//
// Templates receive `flash` on res.locals and consume it the same way.

const emptyStore = () => ({
    success: [],
    error: [],
    warning: [],
    info: []
});

const flashMiddleware = (req, res, next) => {
    // req.flash handles both setting and getting messages:
    //   - 2 args (type, message): stores a new message
    //   - 1 arg (type):           retrieves and clears messages of that type
    //   - 0 args:                 retrieves and clears all messages
    //
    // The set mode intentionally returns nothing while the get modes return
    // arrays, so this dual-purpose function cannot satisfy consistent-return.
    /* eslint-disable consistent-return */
    req.flash = function (type, message) {
        if (!req.session.flash) {
            req.session.flash = emptyStore();
        }

        // SETTING: two arguments means we are storing a new message.
        if (type && message) {
            if (!req.session.flash[type]) {
                req.session.flash[type] = [];
            }
            req.session.flash[type].push(message);
            return;
        }

        // GETTING ONE TYPE: retrieve and clear that type's messages.
        if (type && !message) {
            const messages = req.session.flash[type] || [];
            req.session.flash[type] = [];
            return messages;
        }

        // GETTING ALL: retrieve and clear every message type.
        const allMessages = req.session.flash || emptyStore();
        req.session.flash = emptyStore();
        return allMessages;
    };
    /* eslint-enable consistent-return */

    next();
};

// Makes flash available to all templates via res.locals.
// Runs after flashMiddleware; it only exposes the function — it does not
// consume any messages itself.
const flashLocals = (req, res, next) => {
    res.locals.flash = req.flash;
    next();
};

// Combined middleware: runs flashMiddleware then flashLocals in order.
const flash = (req, res, next) => {
    flashMiddleware(req, res, () => {
        flashLocals(req, res, next);
    });
};

export default flash;
