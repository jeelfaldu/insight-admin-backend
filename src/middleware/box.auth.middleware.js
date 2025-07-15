// src/middleware/box.auth.middleware.js
const { generateNewToken } = require('../services/box.auth.service');

const boxAuthMiddleware = async (req, res, next) => {
    // Check if we have a valid, non-expired token in the current user's session
    const boxSession = req.session?.box;
    const tokenIsValid = boxSession && boxSession.accessToken && Date.now() < boxSession.expiresAt;

    if (tokenIsValid) {
        console.log("Using cached Box token from session.");
        req.box_access_token = boxSession.accessToken; // Attach token to request
        return next(); // Proceed to the controller
    }

    // --- If token is invalid or missing, generate a new one ---
    console.log("No valid Box token in session. Generating a new one...");
    try {
        const tokenData = await generateNewToken();

        // Store the new token and its calculated expiration time in the session
        req.session['box'] = {
            accessToken: tokenData.access_token,
            // Calculate exact expiration timestamp (e.g., in 55 minutes)
            expiresAt: Date.now() + (tokenData.expires_in * 1000) - (50 * 60 * 1000)
        };
        
        // Attach the new token to the current request so it can be used immediately
        req.box_access_token = tokenData.access_token;
        
        // Save the session and proceed
        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return next(err);
            }
            return next();
        });

    } catch (error) {
        console.debug("🚀 ~ boxAuthMiddleware ~ error:", error);
        // If token generation itself fails, block the request.
        return res.status(503).json({ message: "Could not authenticate with Box service." });
    }
};

module.exports = boxAuthMiddleware;