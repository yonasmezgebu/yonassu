/**
 * storageService.js — SINGLE SOURCE OF TRUTH for all file uploads.
 *
 * To switch to S3 / Cloudinary / any object storage:
 *   1. Install the provider SDK (e.g. npm install @aws-sdk/client-s3 multer-s3)
 *   2. Replace createStorage() with a multer-s3 or memoryStorage adapter
 *   3. Update getFileUrl() to return the CDN/bucket URL
 *   4. Everything else in the codebase stays exactly the same.
 *
 * All upload directories live under /uploads/<category>/
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ─── STORAGE PROVIDER SWITCH ──────────────────────────────────────────────────
// Set STORAGE_PROVIDER='local' (default) or 'memory' (for S3 pipe-through) in .env
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

// Root uploads folder — relative to backend process.cwd()
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

// ─── ALL UPLOAD BUCKETS ───────────────────────────────────────────────────────
// Each key = a "bucket". Value = sub-path inside /uploads/
// When you move to object storage, each key becomes an S3 "prefix" or Cloudinary folder.
const BUCKETS = {
  // ── Finance & Payments ──────────────────────────────────────────────────────
  receipts:        'receipts',          // Payment proofs / receipts
  orders:          'orders',            // Purchase order attachments
  expenses:        'expenses',          // Expense claim receipts
  taxDocuments:    'tax-documents',     // Tax certificates, VAT docs
  signatures:      'signatures',        // Digital payment signatures
  financePayroll:  'finance-payroll',   // Payroll-related finance uploads

  // ── POS & Products ──────────────────────────────────────────────────────────
  products:        'products',          // Product images (general store, retail)

  // ── Pharmacy ────────────────────────────────────────────────────────────────
  pharmacyDrugs:         'pharmacy/drugs',
  pharmacyCovers:        'pharmacy/covers',
  pharmacyCategories:    'pharmacy/categories',
  pharmacyBranches:      'pharmacy/branches',
  pharmacyHealth:        'pharmacy/health',
  pharmacyProductPosts:  'pharmacy/product-posts',

  // ── Human Resources ─────────────────────────────────────────────────────────
  hrDocs:          'hr/documents',      // Contracts, certificates, policies
  hrIdPhotos:      'hr/id-photos',      // Employee ID card scans
  applications:    'applications',      // Job applicant ID images

  // ── Chat & Messaging ────────────────────────────────────────────────────────
  chat:            'chat',              // Chat attachments (images, files)

  // ── Public-facing content ────────────────────────────────────────────────────
  gallery:         'gallery',           // Photo gallery images
  hero:            'hero',              // Hero / banner images for website
  news:            'news',              // News / blog post images
  tenders:         'tenders',           // Tender documents & images
  serviceObjects:  'service-objects',   // Service / product showcase images
  contacts:        'contacts',          // Contact-form attachments

  // ── Printing ────────────────────────────────────────────────────────────────
  printingWork:    'printing/work',     // Printing job files
  printingPosts:   'printing/posts',    // Printing promotional post images

  // ── Store operations ────────────────────────────────────────────────────────
  storeResearch:   'store/research',    // Purchase research documents

  // ── User profiles ────────────────────────────────────────────────────────────
  profile:         'profile',           // Profile photos for all users

  // ── Rental & Vehicles ───────────────────────────────────────────────────────
  cars:            'cars',              // Car images

  // ── Catch-all temp ──────────────────────────────────────────────────────────
  temp:            'temp',              // Temporary / unclassified uploads
};

// ─── ALLOWED FILE TYPES PER BUCKET ───────────────────────────────────────────
// Controls what MIME types are accepted for each bucket.
// 'any' = accept all (use with caution).
const BUCKET_TYPES = {
  receipts:       ['image/jpeg','image/png','application/pdf'],
  orders:         ['image/jpeg','image/png','application/pdf','application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  expenses:       ['image/jpeg','image/png','application/pdf'],
  taxDocuments:   ['image/jpeg','image/png','application/pdf'],
  signatures:     ['image/jpeg','image/png','image/webp'],
  financePayroll: ['image/jpeg','image/png','application/pdf'],

  products:       ['image/jpeg','image/png','image/webp'],

  pharmacyDrugs:        ['image/jpeg','image/png','image/webp'],
  pharmacyCovers:       ['image/jpeg','image/png','image/webp'],
  pharmacyCategories:   ['image/jpeg','image/png','image/webp'],
  pharmacyBranches:     ['image/jpeg','image/png','image/webp'],
  pharmacyHealth:       ['image/jpeg','image/png','application/pdf'],
  pharmacyProductPosts: ['image/jpeg','image/png','image/webp'],

  hrDocs:      ['image/jpeg','image/png','application/pdf','application/msword',
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                 'application/vnd.ms-excel',
                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                 'text/plain'],
  hrIdPhotos:  ['image/jpeg','image/png','image/webp'],
  applications:['image/jpeg','image/png','image/webp'],

  chat:        ['image/jpeg','image/png','image/webp','image/gif',
                 'application/pdf','application/msword',
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                 'video/mp4','audio/mpeg'],

  gallery:     ['image/jpeg','image/png','image/webp'],
  hero:        ['image/jpeg','image/png','image/webp'],
  news:        ['image/jpeg','image/png','image/webp'],
  tenders:     ['image/jpeg','image/png','image/gif','application/pdf'],
  serviceObjects: ['image/jpeg','image/png','image/webp'],
  contacts:    ['image/jpeg','image/png','application/pdf','application/msword',
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

  printingWork:  ['image/jpeg','image/png','image/gif','image/webp',
                  'application/pdf','application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/zip'],
  printingPosts: ['image/jpeg','image/png','image/webp'],

  storeResearch: ['image/jpeg','image/png','application/pdf',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'text/plain'],

  profile: ['image/jpeg','image/png','image/webp'],
  cars:    ['image/jpeg','image/png','image/webp'],
  temp:    'any',
};

// ─── SIZE LIMITS PER BUCKET (bytes) ──────────────────────────────────────────
const BUCKET_SIZE = {
  chat:       20 * 1024 * 1024,   // 20 MB
  news:       25 * 1024 * 1024,   // 25 MB
  tenders:    10 * 1024 * 1024,   // 10 MB
  hrDocs:     10 * 1024 * 1024,   // 10 MB
  hrIdPhotos: 10 * 1024 * 1024,   // 10 MB
  applications: 5 * 1024 * 1024,  // 5 MB
  contacts:   5 * 1024 * 1024,    // 5 MB
  gallery:    5 * 1024 * 1024,    // 5 MB
  printingWork: 50 * 1024 * 1024, // 50 MB (print files can be large)
  // Default for everything else:
  _default:   15 * 1024 * 1024,   // 15 MB
};

// ─── INIT: CREATE ALL LOCAL DIRECTORIES ──────────────────────────────────────
function ensureDirectories() {
  for (const rel of Object.values(BUCKETS)) {
    const full = path.join(UPLOADS_ROOT, rel);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  }
  // Gallery thumbnails subdirectory
  const thumbs = path.join(UPLOADS_ROOT, 'gallery', 'thumbnails');
  if (!fs.existsSync(thumbs)) fs.mkdirSync(thumbs, { recursive: true });
}
ensureDirectories();

// ─── FILENAME GENERATOR ───────────────────────────────────────────────────────
function generateFilename(originalname, prefix = '') {
  const ext = path.extname(originalname).toLowerCase() || '.bin';
  return `${prefix}${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
}

// ─── STORAGE FACTORY ─────────────────────────────────────────────────────────
// Returns a multer StorageEngine for the given bucket.
// OBJECT STORAGE: replace this function body to return a multer-s3 engine,
// passing the bucket name as the S3 prefix.
function createStorage(bucketKey) {
  const rel = BUCKETS[bucketKey] || BUCKETS.temp;
  const destPath = path.join(UPLOADS_ROOT, rel);

  // Local disk storage (default)
  return multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      const prefix = req.user?.id ? `${req.user.id}_` : '';
      cb(null, generateFilename(file.originalname, prefix));
    },
  });
}

// ─── FILE FILTER FACTORY ──────────────────────────────────────────────────────
function createFileFilter(bucketKey) {
  const allowed = BUCKET_TYPES[bucketKey];
  return (req, file, cb) => {
    if (!file.originalname || file.mimetype === 'application/octet-stream') {
      return cb(null, false); // Skip empty/browser-generated blank files
    }
    if (allowed === 'any' || !allowed) return cb(null, true);
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Invalid file type for ${bucketKey}. Allowed: ${allowed.join(', ')}`), false);
  };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Create a multer uploader for a bucket.
 * @param {string} bucketKey  - Key from BUCKETS map
 * @param {number} maxCount   - 1 = single file, >1 = multiple files
 * @param {string} fieldName  - multer field name (only used for single/array mode)
 * @returns multer middleware (call with .single(field) / .array(field, n) / .fields([...]) yourself)
 */
function uploader(bucketKey, options = {}) {
  const maxSize = options.maxSize || BUCKET_SIZE[bucketKey] || BUCKET_SIZE._default;
  const maxFiles = options.maxFiles || 10;
  return multer({
    storage: createStorage(bucketKey),
    fileFilter: createFileFilter(bucketKey),
    limits: { fileSize: maxSize, files: maxFiles },
  });
}

/**
 * Returns the public-facing URL for a stored file path.
 * When using local storage: /uploads/<rel-path>/<filename>
 * OBJECT STORAGE: return the CDN / presigned URL here.
 * @param {string} bucketKey
 * @param {string} filename
 */
function getFileUrl(bucketKey, filename) {
  const rel = BUCKETS[bucketKey] || BUCKETS.temp;
  return `/uploads/${rel}/${filename}`;
}

/**
 * Delete a file from storage.
 * OBJECT STORAGE: call s3.deleteObject() here.
 * @param {string} absolutePathOrUrl  - Full path or /uploads/... relative URL
 */
function deleteFile(absolutePathOrUrl) {
  try {
    // Handle /uploads/... URLs
    const fullPath = absolutePathOrUrl.startsWith('/')
      ? path.join(process.cwd(), absolutePathOrUrl)
      : absolutePathOrUrl;
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (e) {
    // Non-fatal — log but don't crash
    console.warn('[storageService] deleteFile failed:', e.message);
  }
}

/**
 * Multer error handler middleware — drop this after any upload route.
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const msgs = {
      LIMIT_FILE_SIZE:     'File too large.',
      LIMIT_FILE_COUNT:    'Too many files.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected upload field.',
    };
    return res.status(400).json({ status: 'error', message: msgs[err.code] || err.message });
  }
  if (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
  next();
}

// Pre-built uploaders — ready-to-use .single() / .array() multer instances.
// Use these in route files so you never write multer config inline again.
const upload = {
  // Finance & Payments
  receipt:        uploader('receipts'),
  paymentProof:   uploader('receipts'),
  signature:      uploader('signatures'),
  orderAttachment:uploader('orders'),
  expense:        uploader('expenses'),
  taxDocument:    uploader('taxDocuments'),
  financePayroll: uploader('financePayroll'),

  // Products & POS
  productImage:   uploader('products'),

  // Pharmacy
  pharmacyDrug:        uploader('pharmacyDrugs'),
  pharmacyCover:       uploader('pharmacyCovers'),
  pharmacyCategory:    uploader('pharmacyCategories'),
  pharmacyBranch:      uploader('pharmacyBranches'),
  pharmacyHealth:      uploader('pharmacyHealth',    { maxFiles: 2 }),
  pharmacyProductPost: uploader('pharmacyProductPosts'),

  // HR
  hrDoc:        uploader('hrDocs'),
  hrIdPhoto:    uploader('hrIdPhotos'),
  application:  uploader('applications'),

  // Chat
  chat:         uploader('chat',    { maxFiles: 5 }),

  // Public content
  gallery:      uploader('gallery'),
  hero:         uploader('hero'),
  news:         uploader('news'),
  tender:       uploader('tenders',       { maxFiles: 5 }),
  serviceObject:uploader('serviceObjects'),
  contact:      uploader('contacts'),

  // Printing
  printingWork: uploader('printingWork',  { maxFiles: 10 }),
  printingPost: uploader('printingPosts'),

  // Store
  storeResearch:uploader('storeResearch'),

  // User profile / vehicles
  profile:      uploader('profile'),
  car:          uploader('cars'),

  // Generic temp
  temp:         uploader('temp'),
};

module.exports = {
  BUCKETS,
  BUCKET_TYPES,
  BUCKET_SIZE,
  UPLOADS_ROOT,
  uploader,
  upload,
  getFileUrl,
  deleteFile,
  handleUploadError,
};
