import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ========================================
// Middleware לאימות משתמש מחובר
// ========================================
// הפונקציה הזו בודקת אם המשתמש שלח Token תקין
// אם כן - ממשיכה לפונקציה הבאה
// אם לא - מחזירה שגיאה 401

export const protect = async (req, res, next) => {
    let token;
    
    try {
        // בדיקה אם יש Authorization header עם Bearer token
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // חילוץ ה-token מה-header
            // פורמט: "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];
            
            // אימות ה-token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // שליפת המשתמש מה-DB לפי ה-ID שבתוך ה-token
            // select('-password') - מביא את כל השדות חוץ מהסיסמה
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ 
                    message: 'משתמש לא נמצא' 
                });
            }
            
            // המשתמש מאומת! ממשיכים לפונקציה הבאה
            next();
        } else {
            // אין token בכלל
            return res.status(401).json({ 
                message: 'לא מורשה - אין Token' 
            });
        }
    } catch (error) {
        console.error('שגיאת אימות:', error.message);
        
        // טיפול בשגיאות ספציפיות של JWT
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Token לא תקין' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token פג תוקף' 
            });
        }
        
        return res.status(401).json({ 
            message: 'לא מורשה' 
        });
    }
};

// ========================================
// Middleware לבדיקת הרשאות אדמין (לעתיד)
// ========================================
export const admin = (req, res, next) => {
    // בודק אם המשתמש הוא אדמין
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            message: 'אין הרשאה - נדרשת הרשאת אדמין' 
        });
    }
};