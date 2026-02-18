// server/middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';

// Storage settings: Files ko 'uploads/' folder mein save karo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // File ka naam unique rakho: fieldname-timestamp.extension
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type (Sirf images allow karo)
const checkFileTypes = (file, cb) => {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
};

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    checkFileTypes(file, cb);
  }
});

export default upload;