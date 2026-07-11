/**
 * upload.js
 * Multer using memoryStorage — files go to Cloudinary, not local disk.
 */
const multer = require('multer');

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'application/pdf',
    'application/epub+zip',
    'application/x-mobipocket-ebook', // .mobi
    'application/octet-stream',        // generic binary (some .epub/.mobi uploads)
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type not allowed: ${file.mimetype}`));
};

// Single-file upload — field name 'file' — stores in memory
const _uploadSingle = multer({
  storage:    multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for large videos
}).single('file');

// Multi-field upload — coverFile + downloadFile (for books)
const _uploadBookFiles = multer({
  storage:    multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
}).fields([
  { name: 'coverFile',    maxCount: 1 },
  { name: 'downloadFile', maxCount: 1 },
]);

// Promise wrappers
const uploadSingle = (req, res) =>
  new Promise((resolve, reject) => {
    _uploadSingle(req, res, (err) => { if (err) reject(err); else resolve(); });
  });

const uploadBookFiles = (req, res) =>
  new Promise((resolve, reject) => {
    _uploadBookFiles(req, res, (err) => { if (err) reject(err); else resolve(); });
  });

module.exports = { uploadSingle, uploadBookFiles };
