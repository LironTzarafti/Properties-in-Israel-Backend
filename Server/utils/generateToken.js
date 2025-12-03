import jwt from 'jsonwebtoken';

// ========================================
// פונקציה ליצירת Access Token (15 דקות)
// ========================================
export const generateAccessToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // 15 דקות
    );
};

// ========================================
// פונקציה ליצירת Refresh Token (30 יום)
// ========================================
export const generateRefreshToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, // ניתן להשתמש באותו סוד או בנפרד
        { expiresIn: '30d' } // 30 יום
    );
};

// ========================================
// פונקציה מקורית (לתאימות לאחור)
// ========================================
const generateToken = (id) => {
    return generateAccessToken(id);
};

export default generateToken;