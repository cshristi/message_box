const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user_profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => {
      // Remove file extension from originalname and add timestamp
      const nameWithoutExt = file.originalname.split('.')[0];
      return Date.now() + '-' + nameWithoutExt;
    },
  },
});

module.exports = {
  cloudinary,
  storage,
};