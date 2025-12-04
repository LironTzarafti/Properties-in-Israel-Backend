import jwt from 'jsonwebtoken';

// ========================================
// פונקציה ליצירת Access Token (7 ימים)
// ========================================
// ✅ שינוי: 15m → 7d
// ✅ הסרנו את generateRefreshToken - לא צריך יותר!
export const generateAccessToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // ✅ 7 ימים במקום 15 דקות!
    );
};

// ========================================
// פונקציה מקורית (לתאימות לאחור)
// ========================================
const generateToken = (id) => {
    return generateAccessToken(id);
};

export default generateToken;

