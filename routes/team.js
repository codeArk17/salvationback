const express    = require('express');
const router     = express.Router();
const TeamMember = require('../TeamMember');
const adminAuth  = require('../adminAuth');
const { uploadSingle }       = require('../upload');
const { uploadToCloudinary } = require('../cloudinary');

const SERVER_BASE = process.env.SERVER_URL || 'https://salvationback.onrender.com';

// Public: list all team members
router.get('/', async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ order: 1, createdAt: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: add team member
router.post('/', adminAuth, async (req, res) => {
  try { await uploadSingle(req, res); } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  try {
    let photoUrl = req.body.photoUrl || '';
    if (req.file) {
      try {
        photoUrl = await uploadToCloudinary(req.file.buffer, 'team', 'image');
      } catch {
        photoUrl = `${SERVER_BASE}/uploads/${Date.now()}-team.jpg`;
      }
    }
    const member = await TeamMember.create({
      name:     req.body.name,
      role:     req.body.role     || '',
      bio:      req.body.bio      || '',
      category: req.body.category || 'Leadership',
      photoUrl,
      order:    parseInt(req.body.order) || 0,
    });
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update team member
router.put('/:id', adminAuth, async (req, res) => {
  try { await uploadSingle(req, res); } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  try {
    const update = { ...req.body };
    delete update._id;
    if (req.file) {
      try {
        update.photoUrl = await uploadToCloudinary(req.file.buffer, 'team', 'image');
      } catch {
        update.photoUrl = `${SERVER_BASE}/uploads/${Date.now()}-team.jpg`;
      }
    }
    if (update.order) update.order = parseInt(update.order) || 0;
    const member = await TeamMember.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after', runValidators: true });
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    res.json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete team member
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
