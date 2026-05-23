// src/routes/routes.js — CommonJS
'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── GET /:routeId/tariffs ────────────────────────────────────────────────────
// Returns all APPROVED tariffs for a route, including vehicleType.
// If the requester is authenticated, also returns their own PENDING tariffs
// (one per vehicle type).
router.get('/:routeId/tariffs', async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({ error: 'Invalid route ID' });
    }

    // Optionally resolve user from token (non-blocking)
    let userId = null;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        userId = payload.id;
      } catch (_) {
        // ignore invalid token — just treat as unauthenticated
      }
    }

    // Fetch all APPROVED tariffs for this route
    const approved = await prisma.tariff.findMany({
      where: { routeId, status: 'APPROVED' },
      include: { vehicleType: true },
      orderBy: { effectiveDate: 'desc' },
    });

    // Serialize Decimal values
    const serializedApproved = approved.map(serializeTariff);

    // If authenticated, fetch user's own PENDING tariffs (one per vehicle type)
    let pendingByUser = [];
    if (userId) {
      const pending = await prisma.tariff.findMany({
        where: { routeId, status: 'PENDING', createdById: userId },
        include: { vehicleType: true },
        orderBy: { createdAt: 'desc' },
      });

      // Deduplicate: one per vehicle type (most recent)
      const seenVehicleTypes = new Set();
      for (const t of pending) {
        if (!seenVehicleTypes.has(t.vehicleTypeId)) {
          seenVehicleTypes.add(t.vehicleTypeId);
          pendingByUser.push(serializeTariff(t));
        }
      }
    }

    return res.json({
      approved: serializedApproved,
      pendingByUser,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:routeId/comments ───────────────────────────────────────────────────
// Returns comments for a route, including user email. Newest first.
router.get('/:routeId/comments', async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({ error: 'Invalid route ID' });
    }

    const comments = await prisma.comment.findMany({
      where: { routeId },
      include: {
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(comments);
  } catch (err) {
    next(err);
  }
});

// ─── POST /:routeId/comments ──────────────────────────────────────────────────
// Creates a comment on a route. Requires authentication.
router.post(
  '/:routeId/comments',
  authenticate,
  [
    body('body').notEmpty().withMessage('Comment body is required').trim(),
    body('cityId').isInt({ min: 1 }).withMessage('Valid cityId is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const routeId = parseInt(req.params.routeId, 10);
      if (isNaN(routeId)) {
        return res.status(400).json({ error: 'Invalid route ID' });
      }

      const { body: commentBody, cityId } = req.body;

      const comment = await prisma.comment.create({
        data: {
          userId: req.user.id,
          routeId,
          cityId: parseInt(cityId, 10),
          body: commentBody,
        },
        include: {
          user: { select: { email: true } },
        },
      });

      return res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function serializeTariff(t) {
  return {
    id: t.id,
    routeId: t.routeId,
    vehicleTypeId: t.vehicleTypeId,
    vehicleType: t.vehicleType,
    baseFare: t.baseFare.toString(),
    nightFare: t.nightFare ? t.nightFare.toString() : null,
    peakFare: t.peakFare ? t.peakFare.toString() : null,
    currency: t.currency,
    effectiveDate: t.effectiveDate,
    sourceDocumentUrl: t.sourceDocumentUrl,
    isVerified: t.isVerified,
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

module.exports = router;
