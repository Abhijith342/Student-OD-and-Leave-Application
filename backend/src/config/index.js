require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-student-od-leave-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  storageType: process.env.STORAGE_TYPE || 'LOCAL',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'student-od-leave-bucket',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
};
