/**
 * POST /api/auth/login
 * Body: { password: string }
 * Returns: { token: string } on success, 401 on failure.
 *
 * The "token" is simply the admin password used as a bearer value.
 * The frontend must send it back as the x-admin-token header on
 * every protected request.
 */
const express = require('express');
const router  = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }
  return res.json({ token: ADMIN_PASSWORD });
});

// Change admin password
router.post('/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers['x-admin-token'];

  // Verify current password
  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  if (!oldPassword || oldPassword !== ADMIN_PASSWORD) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  // Update the in-memory password for this session
  process.env.ADMIN_PASSWORD = newPassword;

  return res.json({ message: 'Password changed successfully. Update ADMIN_PASSWORD in your .env and Render environment variables to make it permanent.' });
});

module.exports = router;
