import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getMe,
    updateProfile,
    logoutUser,
    deleteAccount,
    refreshAccessToken  // ✅ חדש
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { verifyRefreshToken } from '../middleware/refreshTokenMiddleware.js'; // ✅ חדש

const router = express.Router();

// ========================================
// נתיבי Authentication
// ========================================

// POST /api/auth/register - הרשמת משתמש חדש (Public)
router.post('/register', registerUser);

// POST /api/auth/login - התחברות (Public)
router.post('/login', loginUser);

// POST /api/auth/refresh - רענון Access Token (Public אבל דורש Refresh Token בקוקי) ✅ חדש
router.post('/refresh', verifyRefreshToken, refreshAccessToken);

// GET /api/auth/me - קבלת פרטי המשתמש המחובר (Private)
router.get('/me', protect, getMe);

// PUT /api/auth/profile - עדכון פרופיל משתמש (Private)
router.put('/profile', protect, updateProfile);

// POST /api/auth/logout - התנתקות (Private)
router.post('/logout', protect, logoutUser);

// DELETE /api/auth/account - מחיקת חשבון המשתמש המחובר (Private)
router.delete('/account', protect, deleteAccount);

export default router;