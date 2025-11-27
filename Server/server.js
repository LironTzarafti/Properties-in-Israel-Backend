import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectMongoDB from './config/db.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// ========================================
// ייבוא Routes
// ========================================
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js'; // 🆕 הוספה

// ========================================
// הגדרות בסיסיות
// ========================================
dotenv.config(); // טעינת משתני סביבה מקובץ .env
connectMongoDB(); // חיבור ל-MongoDB

app.use(helmet());

const app = express();

// ========================================
// Middleware
// ========================================

// CORS - מאפשר לצד הלקוח לדבר עם השרת
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // כתובת צד הלקוח
    credentials: true, // מאפשר שליחת cookies
}));

// Body Parser - מאפשר קריאת JSON מבקשות
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter - מונה בקשות מכל IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 100, // מקסימום 100 בקשות לכל IP
    message: 'יותר מדי בקשות מ-IP זה, נסה שוב מאוחר יותר'
  });
  
  app.use('/api/', limiter);

// לוג בקשות (אופציונלי - לדיבאג)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

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
            favorites: '/api/favorites' // 🆕 הוספה
        }
    });
});

// נתיבי Authentication
app.use('/api/auth', authRoutes);

// נתיבי Properties
app.use('/api/properties', propertyRoutes);

// נתיבי Notifications
app.use('/api/notifications', notificationRoutes);

// נתיבי Favorites - 🆕 הוספה
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