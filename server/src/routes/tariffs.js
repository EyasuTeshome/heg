// src/routes/tariffs.js — CommonJS
'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST / — Submit a new tariff (PENDING) ───────────────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('routeId').isInt({ min: 1 }).withMessage('Valid routeId is required'),
    body('vehicleTypeId').isInt({ min: 1 }).withMessage('Valid vehicleTypeId is required'),
    body('baseFare').isFloat({ gt: 0 }).withMessage('baseFare must be a positive number'),
    body('nightFare').optional().isFloat({ gt: 0 }).withMessage('nightFare must be positive'),
    body('peakFare').optional().isFloat({ gt: 0 }).withMessage('peakFare must be positive'),
    body('effectiveDate').isISO8601().withMessage('effectiveDate must be a valid ISO 8601 date'),
    body('sourceDocumentUrl').optional().isURL().withMessage('sourceDocumentUrl must be a valid URL'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const {
        routeId,
        vehicleTypeId,
        baseFare,
        nightFare,
        peakFare,
        effectiveDate,
        sourceDocumentUrl,
      } = req.body;

      const tariff = await prisma.tariff.create({
        data: {
          routeId: parseInt(routeId, 10),
          vehicleTypeId: parseInt(vehicleTypeId, 10),
          baseFare: parseFloat(baseFare),
          nightFare: nightFare != null ? parseFloat(nightFare) : undefined,
          peakFare: peakFare != null ? parseFloat(peakFare) : undefined,
          effectiveDate: new Date(effectiveDate),
          sourceDocumentUrl: sourceDocumentUrl || undefined,
          isVerified: false,
          status: 'PENDING',
          createdById: req.user.id,
        },
        include: { vehicleType: true },
      });

      return res.status(201).json(serializeTariff(tariff));
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /me — Tariffs submitted by the authenticated user ────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const tariffs = await prisma.tariff.findMany({
      where: { createdById: req.user.id },
      include: {
        vehicleType: true,
        route: {
          include: {
            originStop: true,
            destinationStop: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(tariffs.map(serializeTariff));
  } catch (err) {
    next(err);
  }
});

// ─── POST /:id/report — Report a tariff ──────────────────────────────────────
router.post(
  '/:id/report',
  authenticate,
  [body('reason').notEmpty().withMessage('Reason is required').trim()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const tariffId = parseInt(req.params.id, 10);
      if (isNaN(tariffId)) {
        return res.status(400).json({ error: 'Invalid tariff ID' });
      }

      const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
      if (!tariff) {
        return res.status(404).json({ error: 'Tariff not found' });
      }

      const report = await prisma.tariffReport.create({
        data: {
          tariffId,
          userId: req.user.id,
          reason: req.body.reason,
        },
      });

      return res.status(201).json(report);
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
    vehicleType: t.vehicleType || undefined,
    route: t.route || undefined,
    baseFare: t.baseFare.toString(),
    nightFare: t.nightFare ? t.nightFare.toString() : null,
    peakFare: t.peakFare ? t.peakFare.toString() : null,
    currency: t.currency,
    effectiveDate: t.effectiveDate,
    sourceDocumentUrl: t.sourceDocumentUrl,
    isVerified: t.isVerified,
    createdById: t.createdById,
    status: t.status,
    rejectionNote: t.rejectionNote,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

module.exports = router;
