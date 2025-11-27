import express from 'express';
import {
    getPublicProperties,
    getMyProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    updatePropertyStatus
} from '../controllers/propertyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// נתיבי Properties
// ========================================

// GET /api/properties/public - קבלת כל הנכסים (ציבורי - לא דורש authentication)
router.get('/public', getPublicProperties);

// GET /api/properties - קבלת כל הנכסים של המשתמש המחובר (דורש authentication)
// POST /api/properties - יצירת נכס חדש (דורש authentication)
router.route('/')
    .get(protect, getMyProperties)
    .post(protect, createProperty);

// GET /api/properties/:id - קבלת נכס בודד
// PUT /api/properties/:id - עדכון נכס
// DELETE /api/properties/:id - מחיקת נכס
router.route('/:id')
    .get(protect, getPropertyById)
    .put(protect, updateProperty)
    .delete(protect, deleteProperty);

// PATCH /api/properties/:id/status - עדכון סטטוס נכס בלבד
router.patch('/:id/status', protect, updatePropertyStatus);

export default router;