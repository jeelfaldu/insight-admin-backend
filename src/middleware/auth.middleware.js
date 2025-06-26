const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  // 1. Get token from the 'Authorization' header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  // The header format is "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: Malformed token' });
  }
  
  try {
    // 2. Verify the token using our JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. If valid, add the decoded user payload to the request object
    req.user = decoded; // Now other routes can access req.user
    next(); // Proceed to the next middleware or route handler
  } catch (ex) {
    // 4. If not valid, send an error
    res.status(400).json({ message: 'Invalid Token' });
  }
};