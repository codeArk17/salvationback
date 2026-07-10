const express     = require('express');
const router      = express.Router();
const path        = require('path');
const fs          = require('fs');
const GalleryItem = require('../Gallery');
const adminAuth   = require('../adminAuth');
const { uploadSingle } = require('../upload');
const { uploadToCloudinary } = require('../cloudinary');

const SERVER_BASE = process.env.SERVER_URL || 'https://salvationback.onrender.com';
const UPLOAD_DIR  = path.join(__dirname, '..', 'uploads');

function isCloudinaryConfigured() {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUD_NAME' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

async function compressIfImage(buffer, mimetype) {
  if (!mimetype.startsWith('image/')) return buffer;
  try {
    const sharp = require('sharp');
    return await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return buffer;
  }
}

async function storeFile(buffer, mimetype, originalname) {
  const processedBuffer = await compressIfImage(buffer, mimetype);
  if (isCloudinaryConfigured()) {
    const resourceType = mimetype.startsWith('video/') ? 'video' : 'image';
    return await uploadToCloudinary(processedBuffer, 'gallery', resourceType);
  }
  // Local fallback
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const safe     = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${safe}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), processedBuffer);
  return `${SERVER_BASE}/uploads/${filename}`;
}

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
    console.log('Gallery POST — Cloudinary configured:', isCloudinaryConfigured());
    console.log('Gallery POST — has file:', !!req.file, '— body.url:', req.body.url);

    let url;

    if (req.file) {
      url = await storeFile(req.file.buffer, req.file.mimetype, req.file.originalname);
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
    console.error('Gallery POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: delete ────────────────────────────────────────────────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Gallery item not found.' });
    if (item.url && item.url.includes('/uploads/')) {
      const filename = path.basename(item.url);
      const filepath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    res.json({ message: 'Gallery item deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
