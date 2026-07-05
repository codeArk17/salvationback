const express     = require('express');
const router      = express.Router();
const GalleryItem = require('../Gallery');
const adminAuth   = require('../adminAuth');
const { uploadSingle } = require('../upload');
const { uploadToCloudinary } = require('../cloudinary');

// ─── Public: list gallery items ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = req.query.mediaType ? { mediaType: req.query.mediaType } : {};
    const items  = await GalleryItem.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: add gallery item ──────────────────────────────────────────────────
router.post('/', adminAuth, async (req, res) => {
  try { await uploadSingle(req, res); } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    let url;

    if (req.file) {
      // Upload buffer to Cloudinary
      const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      url = await uploadToCloudinary(req.file.buffer, 'gallery', resourceType);
    } else if (req.body.url) {
      url = req.body.url;
    } else {
      return res.status(400).json({ error: 'Please upload a file or provide a URL.' });
    }

    const mediaType = req.body.mediaType ||
      (req.file && req.file.mimetype.startsWith('video/') ? 'video' : 'photo');

    const item = await GalleryItem.create({
      url, mediaType,
      title:    req.body.title    || '',
      category: req.body.category || 'General',
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: delete ────────────────────────────────────────────────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Gallery item not found.' });
    res.json({ message: 'Gallery item deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
