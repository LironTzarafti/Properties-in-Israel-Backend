import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// כל הנתיבים דורשים authentication
router.use(protect);

// GET /api/notifications - קבלת כל ההתראות
router.get('/', getNotifications);

// PUT /api/notifications/read-all - סימון כל ההתראות כנקראו
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read - סימון התראה כנקראה
router.put('/:id/read', markAsRead);

// DELETE /api/notifications/:id - מחיקת התראה
router.delete('/:id', deleteNotification);

export default router;

