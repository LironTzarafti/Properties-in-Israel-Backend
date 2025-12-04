import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getMe,
    updateProfile,
    logoutUser,
    deleteAccount

} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

// ========================================
// נתיבי Authentication
// ========================================

// POST /api/auth/register - הרשמת משתמש חדש (Public)
router.post('/register', registerUser);

// POST /api/auth/login - התחברות (Public)
router.post('/login', loginUser);

// ✅ הסרנו את /refresh - לא צריך יותר!
// router.post('/refresh', verifyRefreshToken, refreshAccessToken);

// GET /api/auth/me - קבלת פרטי המשתמש המחובר (Private)
router.get('/me', protect, getMe);

// PUT /api/auth/profile - עדכון פרופיל משתמש (Private)
router.put('/profile', protect, updateProfile);

// POST /api/auth/logout - התנתקות (Private)
router.post('/logout', protect, logoutUser);

// DELETE /api/auth/account - מחיקת חשבון המשתמש המחובר (Private)
router.delete('/account', protect, deleteAccount);

export default router;
