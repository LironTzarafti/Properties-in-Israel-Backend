import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectMongoDB from './config/db.js';


// ========================================
// ייבוא Routes
// ========================================
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';

// ========================================
// הגדרות בסיסיות
// ========================================
dotenv.config(); // טעינת משתני סביבה מקובץ .env

const app = express(); // יצירת אפליקציית Express

// ========================================
// Middleware
// ========================================

// Helmet - אבטחה
app.use(helmet());

// CORS - תומך גם בפיתוח וגם בייצור
const allowedOrigins = [
    'https://properties-in-israel-frontend.onrender.com',  // ייצור ברנדר
    'http://localhost:5173',    
    'http://localhost:5174',                                  // פיתוח מקומי - Vite
    'http://localhost:3000',                                // חלופה
    'http://127.0.0.1:5173',                               // חלופה נוספת
];

app.use(cors({
    origin: function (origin, callback) {
        // מאפשר בקשות ללא origin (Postman, Thunder Client, וכו')
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
}));

// Body Parser - מאפשר קריאת JSON מבקשות
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Rate Limit רק לפעולות רגישות
const sensitiveLimiter = rateLimit({
    windowMs: 60 * 1000, // דקה
    max: 15,
    message: 'יותר מדי בקשות. נסה שוב בעוד רגע.',
});

// רק על פעולות רגישות – לא על כל ה-API
app.use('/api/auth', sensitiveLimiter);
app.use('/api/properties', sensitiveLimiter); // יוצרים/מעדכנים

// לוג בקשות (אופציונלי - לדיבאג)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// ========================================
// חיבור MongoDB
// ========================================
connectMongoDB(); // חיבור ל-MongoDB

// ========================================
// Routes (נתיבים)
// ========================================

// נתיב בסיסי לבדיקת שרת
app.get('/', (req, res) => {
    res.json({ 
        message: 'Server is running ✅',
        endpoints: {
            auth: '/api/auth',
            properties: '/api/properties',
            notifications: '/api/notifications',
            favorites: '/api/favorites'
        }
    });
});

// נתיבי Authentication
app.use('/api/auth', authRoutes);

// נתיבי Properties
app.use('/api/properties', propertyRoutes);

// נתיבי Notifications
app.use('/api/notifications', notificationRoutes);

// נתיבי Favorites
app.use('/api/favorites', favoriteRoutes);

// ========================================
// Error Handling Middleware
// ========================================

// טיפול ב-404 - נתיב לא נמצא
app.use((req, res, next) => {
    res.status(404).json({ 
        message: 'נתיב לא נמצא' 
    });
});

// טיפול בשגיאות כלליות
app.use((err, req, res, next) => {
    console.error('שגיאה:', err.stack);
    
    res.status(err.status || 500).json({
        message: err.message || 'שגיאת שרת פנימית',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========================================
// הפעלת השרת
// ========================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   🚀 Server is running on port ${PORT}   ║
    ║   📡 http://localhost:${PORT}            ║
    ╚════════════════════════════════════════╝
    `);
});

