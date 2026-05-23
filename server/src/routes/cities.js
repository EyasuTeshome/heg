// src/routes/cities.js — CommonJS
'use strict';

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ─── GET / ────────────────────────────────────────────────────────────────────
// Returns all active cities with their stops.
router.get('/', async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        stops: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json(cities);
  } catch (err) {
    next(err);
  }
});

// ─── GET /:cityId/routes ──────────────────────────────────────────────────────
// Returns all routes for a city with stop names and latest approved tariff per
// vehicle type (summary).
router.get('/:cityId/routes', async (req, res, next) => {
  try {
    const cityId = parseInt(req.params.cityId, 10);
    if (isNaN(cityId)) {
      return res.status(400).json({ error: 'Invalid city ID' });
    }

    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city || !city.isActive) {
      return res.status(404).json({ error: 'City not found' });
    }

    const routes = await prisma.route.findMany({
      where: { cityId },
      include: {
        originStop: true,
        destinationStop: true,
        tariffs: {
          where: { status: 'APPROVED' },
          include: { vehicleType: true },
          orderBy: { effectiveDate: 'desc' },
        },
      },
    });

    // For each route, reduce tariffs to one per vehicle type (latest effective date)
    const routesWithSummary = routes.map((route) => {
      const latestByVehicle = {};
      for (const tariff of route.tariffs) {
        const key = tariff.vehicleTypeId;
        if (!latestByVehicle[key]) {
          latestByVehicle[key] = tariff;
        }
      }

      return {
        id: route.id,
        cityId: route.cityId,
        originStop: route.originStop,
        destinationStop: route.destinationStop,
        tariffSummary: Object.values(latestByVehicle).map((t) => ({
          vehicleType: t.vehicleType,
          baseFare: t.baseFare.toString(),
          nightFare: t.nightFare ? t.nightFare.toString() : null,
          peakFare: t.peakFare ? t.peakFare.toString() : null,
          currency: t.currency,
          effectiveDate: t.effectiveDate,
          isVerified: t.isVerified,
        })),
      };
    });

    return res.json(routesWithSummary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
