const jwt = require('jsonwebtoken');

/**
 * protect
 * Requires a valid "Authorization: Bearer <token>" header.
 * On success, sets req.user = { id, role } and calls next().
 * On failure, responds 401 immediately.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated. Token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authenticated. Invalid or expired token.' });
  }
};

/**
 * optionalAuth
 * Same as protect but never rejects.
 * Sets req.user = { id, role } if token is valid, else req.user = null.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
  } catch {
    req.user = null;
  }

  next();
};

/**
 * requireRole(...roles)
 * Factory middleware — must be used AFTER protect.
 * Returns 403 if req.user.role is not in the allowed list.
 *
 * Usage: router.get('/mine', protect, requireRole('organizer'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: `Access denied. Required role(s): ${roles.join(', ')}.` });
  }
  next();
};

module.exports = { protect, optionalAuth, requireRole };
