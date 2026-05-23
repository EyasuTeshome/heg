// src/routes/overcharge.js — CommonJS
'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST / — Submit an overcharge report ─────────────────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('routeId').isInt({ min: 1 }).withMessage('Valid routeId is required'),
    body('vehicleType').notEmpty().withMessage('vehicleType is required').trim(),
    body('amountClaimed')
      .isFloat({ gt: 0 })
      .withMessage('amountClaimed must be a positive number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { routeId, vehicleType, amountClaimed } = req.body;

      // Verify route exists
      const route = await prisma.route.findUnique({ where: { id: parseInt(routeId, 10) } });
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      const report = await prisma.overchargeReport.create({
        data: {
          routeId: parseInt(routeId, 10),
          vehicleType,
          amountClaimed: parseFloat(amountClaimed),
          userId: req.user.id,
        },
      });

      return res.status(201).json({
        ...report,
        amountClaimed: report.amountClaimed.toString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
