import jwt from 'jsonwebtoken';

// ========================================
// פונקציה ליצירת JWT Token
// ========================================
// הפונקציה מקבלת ID של משתמש ויוצרת token מוצפן
// ה-token תקף ל-30 יום

const generateToken = (id) => {
    return jwt.sign(
        { id }, // Payload - המידע שנשמר בתוך ה-token
        process.env.JWT_SECRET, // המפתח הסודי להצפנה
        { expiresIn: '30d' } // תוקף ל-30 יום
    );
};

export default generateToken;