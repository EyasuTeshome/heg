// src/middleware/auth.js — CommonJS
'use strict';

const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT access token from the Authorization: Bearer <token> header.
 * Attaches req.user = { id, email, role } on success.
 * Returns 401 if the token is missing or invalid.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Checks that req.user.role === 'ADMIN'.
 * Must be used after authenticate middleware.
 * Returns 403 if the user is not an admin.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
