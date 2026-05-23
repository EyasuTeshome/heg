// src/routes/admin.js — CommonJS
'use strict';

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── Helper: serialize Decimal fields ────────────────────────────────────────
function serializeTariff(t) {
  return {
    ...t,
    baseFare: t.baseFare ? t.baseFare.toString() : null,
    nightFare: t.nightFare ? t.nightFare.toString() : null,
    peakFare: t.peakFare ? t.peakFare.toString() : null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalCities, totalRoutes, pendingTariffs, recentReports] = await Promise.all([
      prisma.city.count({ where: { isActive: true } }),
      prisma.route.count(),
      prisma.tariff.count({ where: { status: 'PENDING' } }),
      prisma.tariffReport.count(),
    ]);

    return res.json({ totalCities, totalRoutes, pendingTariffs, recentReports });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CITIES CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// GET /cities — all cities with stop count
router.get('/cities', async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      include: {
        _count: { select: { stops: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(cities);
  } catch (err) {
    next(err);
  }
});

// POST /cities — create
router.post(
  '/cities',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('region').notEmpty().withMessage('Region is required').trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const city = await prisma.city.create({
        data: { name: req.body.name, region: req.body.region },
      });
      return res.status(201).json(city);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /cities/:id — update
router.put(
  '/cities/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('region').optional().notEmpty().trim(),
    body('isActive').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid city ID' });

      const city = await prisma.city.update({
        where: { id },
        data: {
          ...(req.body.name !== undefined && { name: req.body.name }),
          ...(req.body.region !== undefined && { region: req.body.region }),
          ...(req.body.isActive !== undefined && { isActive: Boolean(req.body.isActive) }),
        },
      });
      return res.json(city);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'City not found' });
      next(err);
    }
  }
);

// DELETE /cities/:id — soft delete (isActive: false)
router.delete('/cities/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid city ID' });

    const city = await prisma.city.update({
      where: { id },
      data: { isActive: false },
    });
    return res.json({ message: 'City deactivated', city });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'City not found' });
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STOPS CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// GET /stops?cityId=X
router.get('/stops', async (req, res, next) => {
  try {
    const cityId = req.query.cityId ? parseInt(req.query.cityId, 10) : undefined;
    const stops = await prisma.stop.findMany({
      where: cityId ? { cityId } : undefined,
      include: { city: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(stops);
  } catch (err) {
    next(err);
  }
});

// POST /stops
router.post(
  '/stops',
  [
    body('cityId').isInt({ min: 1 }).withMessage('Valid cityId is required'),
    body('name').notEmpty().withMessage('Name is required').trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const stop = await prisma.stop.create({
        data: {
          cityId: parseInt(req.body.cityId, 10),
          name: req.body.name,
        },
      });
      return res.status(201).json(stop);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /stops/:id
router.put(
  '/stops/:id',
  [body('name').notEmpty().withMessage('Name is required').trim()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid stop ID' });

      const stop = await prisma.stop.update({
        where: { id },
        data: { name: req.body.name },
      });
      return res.json(stop);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Stop not found' });
      next(err);
    }
  }
);

// DELETE /stops/:id — hard delete
router.delete('/stops/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid stop ID' });

    await prisma.stop.delete({ where: { id } });
    return res.json({ message: 'Stop deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Stop not found' });
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// GET /routes?cityId=X
router.get('/routes', async (req, res, next) => {
  try {
    const cityId = req.query.cityId ? parseInt(req.query.cityId, 10) : undefined;
    const routes = await prisma.route.findMany({
      where: cityId ? { cityId } : undefined,
      include: {
        originStop: true,
        destinationStop: true,
        city: { select: { name: true } },
      },
    });
    return res.json(routes);
  } catch (err) {
    next(err);
  }
});

// POST /routes
router.post(
  '/routes',
  [
    body('cityId').isInt({ min: 1 }).withMessage('Valid cityId is required'),
    body('originStopId').isInt({ min: 1 }).withMessage('Valid originStopId is required'),
    body('destinationStopId').isInt({ min: 1 }).withMessage('Valid destinationStopId is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const route = await prisma.route.create({
        data: {
          cityId: parseInt(req.body.cityId, 10),
          originStopId: parseInt(req.body.originStopId, 10),
          destinationStopId: parseInt(req.body.destinationStopId, 10),
        },
        include: {
          originStop: true,
          destinationStop: true,
        },
      });
      return res.status(201).json(route);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /routes/:id
router.put(
  '/routes/:id',
  [
    body('cityId').optional().isInt({ min: 1 }),
    body('originStopId').optional().isInt({ min: 1 }),
    body('destinationStopId').optional().isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid route ID' });

      const route = await prisma.route.update({
        where: { id },
        data: {
          ...(req.body.cityId !== undefined && { cityId: parseInt(req.body.cityId, 10) }),
          ...(req.body.originStopId !== undefined && { originStopId: parseInt(req.body.originStopId, 10) }),
          ...(req.body.destinationStopId !== undefined && { destinationStopId: parseInt(req.body.destinationStopId, 10) }),
        },
        include: {
          originStop: true,
          destinationStop: true,
        },
      });
      return res.json(route);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Route not found' });
      next(err);
    }
  }
);

// DELETE /routes/:id — hard delete
router.delete('/routes/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid route ID' });

    await prisma.route.delete({ where: { id } });
    return res.json({ message: 'Route deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Route not found' });
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLE TYPES CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// GET /vehicle-types
router.get('/vehicle-types', async (req, res, next) => {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({ orderBy: { name: 'asc' } });
    return res.json(vehicleTypes);
  } catch (err) {
    next(err);
  }
});

// POST /vehicle-types
router.post(
  '/vehicle-types',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('iconSlug').notEmpty().withMessage('iconSlug is required').trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const vt = await prisma.vehicleType.create({
        data: { name: req.body.name, iconSlug: req.body.iconSlug },
      });
      return res.status(201).json(vt);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /vehicle-types/:id
router.put(
  '/vehicle-types/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('iconSlug').optional().notEmpty().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid vehicle type ID' });

      const vt = await prisma.vehicleType.update({
        where: { id },
        data: {
          ...(req.body.name !== undefined && { name: req.body.name }),
          ...(req.body.iconSlug !== undefined && { iconSlug: req.body.iconSlug }),
        },
      });
      return res.json(vt);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Vehicle type not found' });
      next(err);
    }
  }
);

// DELETE /vehicle-types/:id
router.delete('/vehicle-types/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid vehicle type ID' });

    await prisma.vehicleType.delete({ where: { id } });
    return res.json({ message: 'Vehicle type deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Vehicle type not found' });
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TARIFF MODERATION
// ═══════════════════════════════════════════════════════════════════════════════

// GET /tariffs?status=PENDING
router.get('/tariffs', async (req, res, next) => {
  try {
    const statusFilter = req.query.status; // e.g. PENDING | APPROVED | REJECTED
    const where = statusFilter ? { status: statusFilter } : {};

    const tariffs = await prisma.tariff.findMany({
      where,
      include: {
        vehicleType: true,
        route: {
          include: {
            originStop: true,
            destinationStop: true,
          },
        },
        createdBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(tariffs.map(serializeTariff));
  } catch (err) {
    next(err);
  }
});

// POST /tariffs — create verified/approved tariff directly
router.post(
  '/tariffs',
  [
    body('routeId').isInt({ min: 1 }).withMessage('Valid routeId is required'),
    body('vehicleTypeId').isInt({ min: 1 }).withMessage('Valid vehicleTypeId is required'),
    body('baseFare').isFloat({ gt: 0 }).withMessage('baseFare must be a positive number'),
    body('nightFare').optional().isFloat({ gt: 0 }),
    body('peakFare').optional().isFloat({ gt: 0 }),
    body('effectiveDate').isISO8601().withMessage('effectiveDate must be a valid ISO 8601 date'),
    body('sourceDocumentUrl').optional().isURL(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

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
          isVerified: true,
          status: 'APPROVED',
          createdById: req.user.id,
        },
        include: { vehicleType: true, route: { include: { originStop: true, destinationStop: true } } },
      });

      return res.status(201).json(serializeTariff(tariff));
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /tariffs/:id — moderate (approve/reject/edit)
router.patch(
  '/tariffs/:id',
  [
    body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
    body('rejectionNote').optional().isString(),
    body('baseFare').optional().isFloat({ gt: 0 }),
    body('nightFare').optional().isFloat({ gt: 0 }),
    body('peakFare').optional().isFloat({ gt: 0 }),
    body('effectiveDate').optional().isISO8601(),
    body('isVerified').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid tariff ID' });

      // Fetch existing tariff for history snapshot
      const existing = await prisma.tariff.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Tariff not found' });

      const { status, rejectionNote, baseFare, nightFare, peakFare, effectiveDate, isVerified } = req.body;

      // Snapshot into history when approving and baseFare is changing
      const isApproving = status === 'APPROVED';
      const fareIsChanging = baseFare !== undefined && parseFloat(baseFare) !== Number(existing.baseFare);
      if (isApproving && fareIsChanging) {
        await prisma.tariffHistory.create({
          data: {
            tariffId: id,
            baseFare: existing.baseFare,
            nightFare: existing.nightFare,
            peakFare: existing.peakFare,
            effectiveDate: existing.effectiveDate,
          },
        });
      }

      const tariff = await prisma.tariff.update({
        where: { id },
        data: {
          ...(status !== undefined && { status }),
          ...(rejectionNote !== undefined && { rejectionNote }),
          ...(baseFare !== undefined && { baseFare: parseFloat(baseFare) }),
          ...(nightFare !== undefined && { nightFare: parseFloat(nightFare) }),
          ...(peakFare !== undefined && { peakFare: parseFloat(peakFare) }),
          ...(effectiveDate !== undefined && { effectiveDate: new Date(effectiveDate) }),
          ...(isVerified !== undefined && { isVerified: Boolean(isVerified) }),
        },
        include: {
          vehicleType: true,
          route: { include: { originStop: true, destinationStop: true } },
          createdBy: { select: { id: true, email: true } },
        },
      });

      return res.json(serializeTariff(tariff));
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Tariff not found' });
      next(err);
    }
  }
);

// DELETE /tariffs/:id
router.delete('/tariffs/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tariff ID' });

    await prisma.tariff.delete({ where: { id } });
    return res.json({ message: 'Tariff deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tariff not found' });
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /users — all users with city name and tariff count
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        city: { select: { name: true } },
        _count: { select: { tariffs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Strip password hash from response
    return res.json(
      users.map(({ passwordHash, ...u }) => u)
    );
  } catch (err) {
    next(err);
  }
});

// PATCH /users/:id — update role / isActive
router.patch(
  '/users/:id',
  [
    body('role').optional().isIn(['USER', 'ADMIN']),
    body('isActive').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(req.body.role !== undefined && { role: req.body.role }),
          ...(req.body.isActive !== undefined && { isActive: Boolean(req.body.isActive) }),
        },
        select: { id: true, email: true, role: true, isActive: true, cityId: true, createdAt: true },
      });

      return res.json(user);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMMENTS MODERATION
// ═══════════════════════════════════════════════════════════════════════════════

// GET /comments — all comments, newest first
router.get('/comments', async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        user: { select: { email: true } },
        route: {
          include: {
            originStop: true,
            destinationStop: true,
          },
        },
        city: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(comments);
  } catch (err) {
    next(err);
  }
});

// DELETE /comments/:id — hard delete
router.delete('/comments/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid comment ID' });

    await prisma.comment.delete({ where: { id } });
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Comment not found' });
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TARIFF REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /tariff-reports
router.get('/tariff-reports', async (req, res, next) => {
  try {
    const reports = await prisma.tariffReport.findMany({
      include: {
        tariff: {
          include: {
            vehicleType: true,
            route: {
              include: { originStop: true, destinationStop: true },
            },
          },
        },
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      reports.map((r) => ({
        ...r,
        tariff: r.tariff ? serializeTariff(r.tariff) : null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// DELETE /tariff-reports/:id — dismiss
router.delete('/tariff-reports/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid report ID' });

    await prisma.tariffReport.delete({ where: { id } });
    return res.json({ message: 'Report dismissed' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Report not found' });
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OVERCHARGE REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /overcharge-reports — all overcharge reports with route info
router.get('/overcharge-reports', async (req, res, next) => {
  try {
    const reports = await prisma.overchargeReport.findMany({
      include: {
        route: {
          include: { originStop: true, destinationStop: true },
        },
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      reports.map((r) => ({
        ...r,
        amountClaimed: r.amountClaimed.toString(),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /overcharge-stats — aggregate for heat map
router.get('/overcharge-stats', async (req, res, next) => {
  try {
    // Group by routeId, count occurrences and sum amountClaimed
    const grouped = await prisma.overchargeReport.groupBy({
      by: ['routeId'],
      _count: { id: true },
      _sum: { amountClaimed: true },
    });

    // Enrich with route data
    const routeIds = grouped.map((g) => g.routeId);
    const routes = await prisma.route.findMany({
      where: { id: { in: routeIds } },
      include: { originStop: true, destinationStop: true },
    });

    const routeMap = {};
    for (const r of routes) {
      routeMap[r.id] = r;
    }

    const stats = grouped.map((g) => {
      const route = routeMap[g.routeId];
      return {
        routeId: g.routeId,
        route: route
          ? {
              from: route.originStop.name,
              to: route.destinationStop.name,
            }
          : null,
        count: g._count.id,
        totalClaimed: g._sum.amountClaimed ? g._sum.amountClaimed.toString() : '0',
      };
    });

    return res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
