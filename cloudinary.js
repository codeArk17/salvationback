const cloudinary  = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME',
  api_key:    process.env.CLOUDINARY_API_KEY    || 'YOUR_API_KEY',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET',
  secure: true,
  timeout: 180000, // 3 minutes
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer        - File buffer from multer memoryStorage
 * @param {string} folder        - Cloudinary folder (e.g. 'gallery', 'books')
 * @param {string} resourceType  - 'image' | 'video' | 'raw' | 'auto'
 * @returns {Promise<string>}    - secure_url of the uploaded file
 */
function uploadToCloudinary(buffer, folder = 'uploads', resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
      timeout: 180000,
      chunk_size: 20000000, // 20MB chunks — much faster for large videos
    };

    // For videos, use async upload with quality auto to speed things up
    if (resourceType === 'video') {
      options.quality = 'auto';
      options.eager_async = true;
    }

    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = { cloudinary, uploadToCloudinary };
