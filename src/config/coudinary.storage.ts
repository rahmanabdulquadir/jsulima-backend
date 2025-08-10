import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'user_profiles',
      format: file.mimetype.split('/')[1], // automatically extract file format
      transformation: [{ width: 300, height: 300, crop: 'limit' }],
    };
  },
});
