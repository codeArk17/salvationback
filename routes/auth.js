const express = require('express');
const router  = express.Router();

// Always read from process.env so in-memory changes take effect
function getPassword() {
  return process.env.ADMIN_PASSWORD || 'admin';
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== getPassword()) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }
  return res.json({ token: getPassword() });
});

// Change admin password
router.post('/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers['x-admin-token'];

  if (!token || token !== getPassword()) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  if (!oldPassword || oldPassword !== getPassword()) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  process.env.ADMIN_PASSWORD = newPassword;

  return res.json({ message: 'Password changed. Remember to update ADMIN_PASSWORD on Render to make it permanent.' });
});

module.exports = router;
