// src/index.js — CommonJS
'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const citiesRouter = require('./routes/cities');
const routesRouter = require('./routes/routes');
const tariffsRouter = require('./routes/tariffs');
const commentsRouter = require('./routes/comments');
const overchargeRouter = require('./routes/overcharge');
const adminRouter = require('./routes/admin');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/routes', routesRouter);
app.use('/api/tariffs', tariffsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/overcharge', overchargeRouter);
app.use('/api/admin', adminRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TariffCheck server running on port ${PORT}`);
});

module.exports = app;
