const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'ddhhdoqtwst9',
  api_key: '445313524963179',
  api_secret: 'sFBAU-SrhQHyqo5kVPo4vrjcKvg',
});
cloudinary.api.ping()
  .then(r => console.log('✅ Cloudinary connected:', r.status))
  .catch(e => console.error('❌ Error:', e.error?.message || e.message));
