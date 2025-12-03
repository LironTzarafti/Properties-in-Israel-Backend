import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ========================================
// Middleware לאימות Refresh Token מקוקי
// ========================================
export const verifyRefreshToken = async (req, res, next) => {
    try {
        // קריאת הקוקי
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ 
                message: 'לא נמצא Refresh Token' 
            });
        }
        
        // אימות ה-Refresh Token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
        
        // שליפת המשתמש
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                message: 'משתמש לא נמצא' 
            });
        }
        
        req.user = user;
        next();
        
    } catch (error) {
        console.error('❌ [REFRESH] שגיאה באימות Refresh Token:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Refresh Token פג תוקף - נדרשת התחברות מחדש' 
            });
        }
        
        return res.status(401).json({ 
            message: 'Refresh Token לא תקין' 
        });
    }
};