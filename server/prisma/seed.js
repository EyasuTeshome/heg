// prisma/seed.js  — CommonJS
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // ─── Cities ──────────────────────────────────────────────────────────────
  const addisCity = await prisma.city.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Addis Ababa', region: 'Oromia Region' },
  });

  const direDawaCity = await prisma.city.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Dire Dawa', region: 'Dire Dawa Region' },
  });

  const bahirDarCity = await prisma.city.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Bahir Dar', region: 'Amhara Region' },
  });

  console.log('Cities created');

  // ─── Stops ───────────────────────────────────────────────────────────────
  // Addis Ababa stops
  const merkato = await prisma.stop.upsert({
    where: { id: 1 },
    update: {},
    create: { cityId: addisCity.id, name: 'Merkato' },
  });

  const boleAirport = await prisma.stop.upsert({
    where: { id: 2 },
    update: {},
    create: { cityId: addisCity.id, name: 'Bole Airport' },
  });

  const piassa = await prisma.stop.upsert({
    where: { id: 3 },
    update: {},
    create: { cityId: addisCity.id, name: 'Piassa' },
  });

  const mexicoSquare = await prisma.stop.upsert({
    where: { id: 4 },
    update: {},
    create: { cityId: addisCity.id, name: 'Mexico Square' },
  });

  // Dire Dawa stops
  const kezira = await prisma.stop.upsert({
    where: { id: 5 },
    update: {},
    create: { cityId: direDawaCity.id, name: 'Kezira' },
  });

  const sabian = await prisma.stop.upsert({
    where: { id: 6 },
    update: {},
    create: { cityId: direDawaCity.id, name: 'Sabian' },
  });

  const megala = await prisma.stop.upsert({
    where: { id: 7 },
    update: {},
    create: { cityId: direDawaCity.id, name: 'Megala' },
  });

  const ddAirport = await prisma.stop.upsert({
    where: { id: 8 },
    update: {},
    create: { cityId: direDawaCity.id, name: 'Airport' },
  });

  // Bahir Dar stops
  const cityCentre = await prisma.stop.upsert({
    where: { id: 9 },
    update: {},
    create: { cityId: bahirDarCity.id, name: 'City Centre' },
  });

  const lakeShore = await prisma.stop.upsert({
    where: { id: 10 },
    update: {},
    create: { cityId: bahirDarCity.id, name: 'Lake Shore' },
  });

  const busStation = await prisma.stop.upsert({
    where: { id: 11 },
    update: {},
    create: { cityId: bahirDarCity.id, name: 'Bus Station' },
  });

  const university = await prisma.stop.upsert({
    where: { id: 12 },
    update: {},
    create: { cityId: bahirDarCity.id, name: 'University' },
  });

  console.log('Stops created');

  // ─── Routes ──────────────────────────────────────────────────────────────
  // Addis Ababa routes
  const addisRoute1 = await prisma.route.upsert({
    where: { id: 1 },
    update: {},
    create: {
      cityId: addisCity.id,
      originStopId: merkato.id,
      destinationStopId: boleAirport.id,
    },
  });

  const addisRoute2 = await prisma.route.upsert({
    where: { id: 2 },
    update: {},
    create: {
      cityId: addisCity.id,
      originStopId: piassa.id,
      destinationStopId: mexicoSquare.id,
    },
  });

  const addisRoute3 = await prisma.route.upsert({
    where: { id: 3 },
    update: {},
    create: {
      cityId: addisCity.id,
      originStopId: boleAirport.id,
      destinationStopId: merkato.id,
    },
  });

  // Dire Dawa routes
  const ddRoute1 = await prisma.route.upsert({
    where: { id: 4 },
    update: {},
    create: {
      cityId: direDawaCity.id,
      originStopId: kezira.id,
      destinationStopId: sabian.id,
    },
  });

  const ddRoute2 = await prisma.route.upsert({
    where: { id: 5 },
    update: {},
    create: {
      cityId: direDawaCity.id,
      originStopId: megala.id,
      destinationStopId: ddAirport.id,
    },
  });

  const ddRoute3 = await prisma.route.upsert({
    where: { id: 6 },
    update: {},
    create: {
      cityId: direDawaCity.id,
      originStopId: sabian.id,
      destinationStopId: kezira.id,
    },
  });

  // Bahir Dar routes
  const bdRoute1 = await prisma.route.upsert({
    where: { id: 7 },
    update: {},
    create: {
      cityId: bahirDarCity.id,
      originStopId: cityCentre.id,
      destinationStopId: lakeShore.id,
    },
  });

  const bdRoute2 = await prisma.route.upsert({
    where: { id: 8 },
    update: {},
    create: {
      cityId: bahirDarCity.id,
      originStopId: busStation.id,
      destinationStopId: university.id,
    },
  });

  const bdRoute3 = await prisma.route.upsert({
    where: { id: 9 },
    update: {},
    create: {
      cityId: bahirDarCity.id,
      originStopId: lakeShore.id,
      destinationStopId: cityCentre.id,
    },
  });

  console.log('Routes created');

  // ─── Vehicle Types ────────────────────────────────────────────────────────
  const taxi = await prisma.vehicleType.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'taxi', iconSlug: 'taxi' },
  });

  const bajaj = await prisma.vehicleType.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'bajaj', iconSlug: 'bajaj' },
  });

  const minibus = await prisma.vehicleType.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'minibus', iconSlug: 'bus' },
  });

  console.log('Vehicle types created');

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin1234!', 10);
  const userHash = await bcrypt.hash('User1234!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tariffcheck.com' },
    update: {},
    create: {
      email: 'admin@tariffcheck.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      passwordHash: userHash,
      role: 'USER',
      cityId: addisCity.id,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      passwordHash: userHash,
      role: 'USER',
      cityId: direDawaCity.id,
    },
  });

  console.log('Users created');

  // ─── Tariffs ─────────────────────────────────────────────────────────────
  const effectiveDate = new Date('2025-01-01T00:00:00Z');

  // Helper: build tariff fare values for route × vehicle combos
  const tariffsData = [
    // Addis Route 1 (Merkato → Bole Airport)
    { routeId: addisRoute1.id, vehicleTypeId: taxi.id,    baseFare: 50, nightFare: 65, peakFare: 60 },
    { routeId: addisRoute1.id, vehicleTypeId: bajaj.id,   baseFare: 30, nightFare: 39, peakFare: 36 },
    { routeId: addisRoute1.id, vehicleTypeId: minibus.id, baseFare: 20, nightFare: null, peakFare: 24 },

    // Addis Route 2 (Piassa → Mexico Square)
    { routeId: addisRoute2.id, vehicleTypeId: taxi.id,    baseFare: 25, nightFare: 33, peakFare: 30 },
    { routeId: addisRoute2.id, vehicleTypeId: bajaj.id,   baseFare: 15, nightFare: null, peakFare: 18 },
    { routeId: addisRoute2.id, vehicleTypeId: minibus.id, baseFare: 10, nightFare: null, peakFare: 12 },

    // Addis Route 3 (Bole Airport → Merkato)
    { routeId: addisRoute3.id, vehicleTypeId: taxi.id,    baseFare: 50, nightFare: 65, peakFare: 60 },
    { routeId: addisRoute3.id, vehicleTypeId: bajaj.id,   baseFare: 30, nightFare: 39, peakFare: 36 },
    { routeId: addisRoute3.id, vehicleTypeId: minibus.id, baseFare: 20, nightFare: null, peakFare: 24 },

    // Dire Dawa Route 1 (Kezira → Sabian)
    { routeId: ddRoute1.id, vehicleTypeId: taxi.id,    baseFare: 35, nightFare: 46, peakFare: 42 },
    { routeId: ddRoute1.id, vehicleTypeId: bajaj.id,   baseFare: 20, nightFare: 26, peakFare: 24 },
    { routeId: ddRoute1.id, vehicleTypeId: minibus.id, baseFare: 15, nightFare: null, peakFare: 18 },

    // Dire Dawa Route 2 (Megala → Airport)
    { routeId: ddRoute2.id, vehicleTypeId: taxi.id,    baseFare: 45, nightFare: 59, peakFare: 54 },
    { routeId: ddRoute2.id, vehicleTypeId: bajaj.id,   baseFare: 25, nightFare: 33, peakFare: 30 },
    { routeId: ddRoute2.id, vehicleTypeId: minibus.id, baseFare: 18, nightFare: null, peakFare: 22 },

    // Dire Dawa Route 3 (Sabian → Kezira)
    { routeId: ddRoute3.id, vehicleTypeId: taxi.id,    baseFare: 35, nightFare: 46, peakFare: 42 },
    { routeId: ddRoute3.id, vehicleTypeId: bajaj.id,   baseFare: 20, nightFare: 26, peakFare: 24 },
    { routeId: ddRoute3.id, vehicleTypeId: minibus.id, baseFare: 15, nightFare: null, peakFare: 18 },

    // Bahir Dar Route 1 (City Centre → Lake Shore)
    { routeId: bdRoute1.id, vehicleTypeId: taxi.id,    baseFare: 30, nightFare: 39, peakFare: 36 },
    { routeId: bdRoute1.id, vehicleTypeId: bajaj.id,   baseFare: 18, nightFare: null, peakFare: 22 },
    { routeId: bdRoute1.id, vehicleTypeId: minibus.id, baseFare: 12, nightFare: null, peakFare: 14 },

    // Bahir Dar Route 2 (Bus Station → University)
    { routeId: bdRoute2.id, vehicleTypeId: taxi.id,    baseFare: 25, nightFare: 33, peakFare: 30 },
    { routeId: bdRoute2.id, vehicleTypeId: bajaj.id,   baseFare: 15, nightFare: null, peakFare: 18 },
    { routeId: bdRoute2.id, vehicleTypeId: minibus.id, baseFare: 10, nightFare: null, peakFare: 12 },

    // Bahir Dar Route 3 (Lake Shore → City Centre)
    { routeId: bdRoute3.id, vehicleTypeId: taxi.id,    baseFare: 30, nightFare: 39, peakFare: 36 },
    { routeId: bdRoute3.id, vehicleTypeId: bajaj.id,   baseFare: 18, nightFare: null, peakFare: 22 },
    { routeId: bdRoute3.id, vehicleTypeId: minibus.id, baseFare: 12, nightFare: null, peakFare: 14 },
  ];

  for (const t of tariffsData) {
    await prisma.tariff.upsert({
      where: {
        id: tariffsData.indexOf(t) + 1,
      },
      update: {},
      create: {
        routeId: t.routeId,
        vehicleTypeId: t.vehicleTypeId,
        baseFare: t.baseFare,
        nightFare: t.nightFare !== null ? t.nightFare : undefined,
        peakFare: t.peakFare !== null ? t.peakFare : undefined,
        currency: 'ETB',
        effectiveDate,
        isVerified: true,
        status: 'APPROVED',
      },
    });
  }

  console.log('Tariffs created');

  // ─── Comments ─────────────────────────────────────────────────────────────
  const existingComments = await prisma.comment.findMany({
    where: { userId: { in: [user1.id, user2.id] } },
  });

  if (existingComments.length === 0) {
    await prisma.comment.createMany({
      data: [
        {
          userId: user1.id,
          routeId: addisRoute1.id,
          cityId: addisCity.id,
          body: 'Taxis on this route often charge more than the official fare. Be sure to negotiate before boarding.',
        },
        {
          userId: user2.id,
          routeId: ddRoute1.id,
          cityId: direDawaCity.id,
          body: 'Bajajs are the fastest option here during off-peak hours. The fares are usually fair.',
        },
      ],
    });
  }

  console.log('Comments created');

  // ─── Pending tariff submission from user1 ────────────────────────────────
  const existingPending = await prisma.tariff.findFirst({
    where: {
      routeId: addisRoute1.id,
      vehicleTypeId: bajaj.id,
      createdById: user1.id,
      status: 'PENDING',
    },
  });

  if (!existingPending) {
    await prisma.tariff.create({
      data: {
        routeId: addisRoute1.id,
        vehicleTypeId: bajaj.id,
        baseFare: 20,
        currency: 'ETB',
        effectiveDate,
        isVerified: false,
        status: 'PENDING',
        createdById: user1.id,
      },
    });
  }

  console.log('Pending tariff submission created');
  console.log('Seed completed successfully!');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
