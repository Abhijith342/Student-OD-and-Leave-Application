const fs = require('fs');
const path = require('path');
const config = require('../config');

class LocalStorageService {
  constructor() {
    this.uploadDir = config.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file) {
    // file is a multer file object
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const destination = path.join(this.uploadDir, filename);

    if (file.buffer) {
      await fs.promises.writeFile(destination, file.buffer);
    } else if (file.path && file.path !== destination) {
      await fs.promises.copyFile(file.path, destination);
    }

    return {
      fileName: file.originalname,
      filePath: `/uploads/${filename}`,
      storageType: 'LOCAL'
    };
  }

  async deleteFile(filePath) {
    const relativePath = filePath.replace(/^\/uploads\//, '');
    const absolutePath = path.join(this.uploadDir, relativePath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  }

  async getFile(filePath) {
    const relativePath = filePath.replace(/^\/uploads\//, '');
    const absolutePath = path.join(this.uploadDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error('File not found');
    }
    return fs.createReadStream(absolutePath);
  }

  getDownloadUrl(filePath) {
    return filePath; // Local static route URL
  }
}

class S3StorageService {
  constructor() {
    // Placeholders for S3 Client initialization when AWS SDK is present
    this.bucketName = config.aws.bucketName;
  }

  async uploadFile(file) {
    // S3 Upload implementation logic
    // aws-sdk S3 PutObjectCommand can be invoked here
    console.log(`[S3StorageService Mock] Uploading ${file.originalname} to bucket ${this.bucketName}`);
    const key = `documents/${Date.now()}-${file.originalname}`;
    return {
      fileName: file.originalname,
      filePath: `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`,
      storageType: 'S3'
    };
  }

  async deleteFile(filePath) {
    console.log(`[S3StorageService Mock] Deleting ${filePath} from bucket ${this.bucketName}`);
  }

  async getFile(filePath) {
    throw new Error('S3 direct streaming requires AWS SDK credentials configuration');
  }

  getDownloadUrl(filePath) {
    return filePath;
  }
}

class StorageService {
  constructor() {
    if (config.storageType === 'S3') {
      this.service = new S3StorageService();
    } else {
      this.service = new LocalStorageService();
    }
  }

  async uploadFile(file) {
    return await this.service.uploadFile(file);
  }

  async deleteFile(filePath) {
    return await this.service.deleteFile(filePath);
  }

  async getFile(filePath) {
    return await this.service.getFile(filePath);
  }

  getDownloadUrl(filePath) {
    return this.service.getDownloadUrl(filePath);
  }
}

module.exports = new StorageService();
