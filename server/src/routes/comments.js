// src/routes/comments.js — CommonJS
'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── PATCH /:id — Edit own comment ────────────────────────────────────────────
router.patch(
  '/:id',
  authenticate,
  [body('body').notEmpty().withMessage('Comment body is required').trim()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const commentId = parseInt(req.params.id, 10);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment ID' });
      }

      const comment = await prisma.comment.findUnique({ where: { id: commentId } });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this comment' });
      }

      const updated = await prisma.comment.update({
        where: { id: commentId },
        data: { body: req.body.body },
        include: {
          user: { select: { email: true } },
        },
      });

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /:id — Delete own comment ────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
