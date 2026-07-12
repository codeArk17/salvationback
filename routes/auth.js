const express = require('express');
const router  = require('express').Router();
const fs      = require('fs');
const path    = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

// Always read from process.env so in-memory changes take effect
function getPassword() {
  return process.env.ADMIN_PASSWORD || 'admin';
}

// Write new password to .env so it persists across restarts
function persistPassword(newPassword) {
  try {
    let envContent = fs.readFileSync(ENV_PATH, 'utf8');
    if (/^ADMIN_PASSWORD=.*/m.test(envContent)) {
      envContent = envContent.replace(/^ADMIN_PASSWORD=.*/m, `ADMIN_PASSWORD=${newPassword}`);
    } else {
      envContent = `ADMIN_PASSWORD=${newPassword}\n` + envContent;
    }
    fs.writeFileSync(ENV_PATH, envContent, 'utf8');
  } catch (err) {
    console.warn('Could not write to .env:', err.message);
  }
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== getPassword()) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }
  return res.json({ token: getPassword() });
});

router.get('/verify', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== getPassword()) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  return res.json({ valid: true });
});

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
  persistPassword(newPassword); // write to .env so it survives restarts

  return res.json({ message: 'Password changed successfully.' });
});

module.exports = router;
