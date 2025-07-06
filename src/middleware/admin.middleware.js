// src/middleware/admin.middleware.js

module.exports = function (req, res, next) {
    // This middleware assumes that auth.middleware has already run and
    // that req.user has been set from the decoded JWT.

    // Check if the user's role is 'admin'
    console.debug(" req.user:", req.user);
    if (!req.user || req.user.role !== 'admin') {
        // If not, send a 403 Forbidden error
        return res.status(403).json({ message: 'Access Denied: This action requires admin privileges.' });
    }

    // If the user is an admin, proceed to the next handler
    next();
};