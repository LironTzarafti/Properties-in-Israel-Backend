import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ========================================
// Schema של משתמש - מגדיר את מבנה המסמך ב-MongoDB
// ========================================
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'שם הוא שדה חובה'],
        trim: true, // מסיר רווחים מיותרים
    },
    email: {
        type: String,
        required: [true, 'אימייל הוא שדה חובה'],
        unique: true, // מבטיח שאין 2 משתמשים עם אותו אימייל
        lowercase: true, // ממיר לאותיות קטנות
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'אנא הזן כתובת אימייל תקינה'], // בדיקת פורמט אימייל
    },
    password: {
        type: String,
        required: [true, 'סיסמה היא שדה חובה'],
        minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים'],
    },
    // תפקיד המשתמש (רגיל או אדמין) - לעתיד
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    
    // פרטים נוספים
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'תיאור אישי לא יכול להכיל יותר מ-500 תווים'],
    },
    
    // הגדרות התאמה אישית
    preferences: {
        // ערים מועדפות לחיפוש
        preferredCities: [{
            type: String,
            trim: true,
        }],
        
        // סוגי נכסים מועדפים
        preferredPropertyTypes: [{
            type: String,
            trim: true,
        }],
        
        // סוג משתמש (פרטי/עסקי)
        userType: {
            type: String,
            enum: ['private', 'business'],
            default: 'private',
        },
        
        // האם נדלן/מפרסם
        isRealtor: {
            type: Boolean,
            default: false,
        },
        
        // הגדרות התראות
        notificationSettings: {
            newProperties: {
                type: Boolean,
                default: true,
            },
            propertyMatches: {
                type: Boolean,
                default: true,
            },
            propertyUpdates: {
                type: Boolean,
                default: true,
            },
        },
    },
    
    // 🆕 מועדפים של המשתמש
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }],
    
    // סטטיסטיקות משתמש
    stats: {
        propertiesCount: {
            type: Number,
            default: 0,
        },
        favoritesCount: {
            type: Number,
            default: 0,
        },
    },
}, {
    timestamps: true, // מוסיף createdAt ו-updatedAt אוטומטית
});

// ========================================
// Middleware - הצפנת סיסמה לפני שמירה
// ========================================
// pre('save') - רץ לפני כל פעולת שמירה
userSchema.pre('save', async function(next) {
    // אם הסיסמה לא שונתה, תמשיך הלאה
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // יצירת salt (מלח) להצפנה - 10 סיבובים
        const salt = await bcrypt.genSalt(10);
        // הצפנת הסיסמה עם ה-salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ========================================
// Methods - פונקציות שניתן להפעיל על אובייקט משתמש
// ========================================
// פונקציה להשוואת סיסמה מוצפנת
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// ייצוא המודל
export default mongoose.model('User', userSchema);