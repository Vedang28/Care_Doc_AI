---
name: file-upload
description: File upload feature template. Local storage for dev, S3-compatible for production. Image validation, size limits, secure URLs.
---

# Feature Template: File Upload

## What This Creates

- File upload endpoint (single + multiple)
- File type validation (whitelist)
- Size limit enforcement
- Local storage (dev) / S3-compatible (production)
- Signed URLs for private files
- Cleanup on delete

## Environment Variables Required

```env
# Storage type
STORAGE_TYPE=local  # or: s3

# S3 / R2 / MinIO (production)
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=             # for R2/MinIO: https://xxx.r2.cloudflarestorage.com

# Limits
MAX_FILE_SIZE_MB=10
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,application/pdf
```

## Files to Create

```
src/
├── routes/uploadRoutes.js
├── controllers/uploadController.js
├── services/uploadService.js
├── middleware/multerConfig.js   # file parsing
└── utils/storage.js            # local/S3 abstraction
```

## Multer Config (with validation)

```javascript
// src/middleware/multerConfig.js
import multer from 'multer';
import path from 'path';

const allowedTypes = process.env.ALLOWED_MIME_TYPES?.split(',') ?? ['image/jpeg', 'image/png'];
const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),  // always use memory — pipe to S3 or disk
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type not allowed: ${file.mimetype}`, 400, 'INVALID_FILE_TYPE'));
    }
  },
});
```

## Storage Abstraction

```javascript
// src/utils/storage.js — swappable: local or S3

export async function uploadFile(file, folder = 'uploads') {
  if (process.env.STORAGE_TYPE === 's3') {
    return uploadToS3(file, folder);
  }
  return saveLocally(file, folder);
}

export async function deleteFile(key) {
  if (process.env.STORAGE_TYPE === 's3') {
    return deleteFromS3(key);
  }
  return deleteLocal(key);
}

export function getFileUrl(key) {
  if (process.env.STORAGE_TYPE === 's3') {
    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }
  return `${process.env.BASE_URL}/uploads/${key}`;
}
```

## Routes

```
POST   /api/v1/upload/single      → Upload one file
POST   /api/v1/upload/multiple    → Upload up to 5 files
DELETE /api/v1/upload/:key        → Delete file (ownership verified)
```

## Security Notes

- Never execute uploaded files — validate MIME type AND check file signature (magic bytes)
- Generate unique filenames — never use user-provided filename directly
- Store files in a separate subdirectory from app code
- Scan for malware if accepting untrusted uploads (ClamAV or 3rd-party API)
- Set Content-Disposition: attachment for file downloads (prevents XSS via SVG)
- Rate limit upload endpoints (prevent storage abuse)

## Naming Convention

```javascript
const key = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
// Example: uploads/user-123/1234567890-abc123.jpg
```
