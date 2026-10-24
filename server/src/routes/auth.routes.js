const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { INTERESTS } = require('../constants/interests');

const router = express.Router();

// ── Validation chains ─────────────────────────────────────────────────────────

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),

  body('email')
    .isEmail()
    .withMessage('A valid email is required.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.'),

  body('role')
    .optional()
    .isIn(['attendee', 'organizer'])
    .withMessage('Role must be "attendee" or "organizer".'),

  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array.')
    .custom((arr) => {
      const invalid = arr.filter((item) => !INTERESTS.includes(item));
      if (invalid.length > 0) {
        throw new Error(`Invalid interest(s): ${invalid.join(', ')}`);
      }
      return true;
    }),

  body('city').optional().trim(),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required.')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

module.exports = { basePath: '/auth', router };
