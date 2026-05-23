// src/routes/auth.js — CommonJS
'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a short-lived access token (15 min). */
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/** Generate a 7-day refresh token (signed JWT stored in DB). */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, sub: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/** Compute the expiry Date for a new refresh token. */
function refreshTokenExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

/** Safely format a user object for API responses (no password hash). */
function safeUser(user) {
  return { id: user.id, email: user.email, role: user.role };
}

// ─── POST /register ───────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash },
      });

      const accessToken = generateAccessToken(user);
      const refreshTokenValue = generateRefreshToken(user);

      await prisma.refreshToken.create({
        data: {
          token: refreshTokenValue,
          userId: user.id,
          expiresAt: refreshTokenExpiry(),
        },
      });

      return res.status(201).json({
        user: safeUser(user),
        accessToken,
        refreshToken: refreshTokenValue,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /login ──────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const accessToken = generateAccessToken(user);
      const refreshTokenValue = generateRefreshToken(user);

      await prisma.refreshToken.create({
        data: {
          token: refreshTokenValue,
          userId: user.id,
          expiresAt: refreshTokenExpiry(),
        },
      });

      return res.json({
        user: safeUser(user),
        accessToken,
        refreshToken: refreshTokenValue,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /refresh ────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify JWT signature first
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find in DB
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    if (stored.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const user = stored.user;

    // Token rotation — delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = generateAccessToken(user);
    const newRefreshTokenValue = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenValue,
        userId: user.id,
        expiresAt: refreshTokenExpiry(),
      },
    });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenValue,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /logout ─────────────────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
