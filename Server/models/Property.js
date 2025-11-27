import mongoose from 'mongoose';

// ========================================
// Schema של נכס נדל"ן
// ========================================
const propertySchema = new mongoose.Schema({
    // כותרת הנכס
    title: {
        type: String,
        required: [true, 'כותרת היא שדה חובה'],
        trim: true,
        maxlength: [100, 'כותרת לא יכולה להכיל יותר מ-100 תווים'],
    },
    
    // תיאור הנכס
    description: {
        type: String,
        required: [true, 'תיאור הוא שדה חובה'],
        trim: true,
        maxlength: [1000, 'תיאור לא יכול להכיל יותר מ-1000 תווים'],
    },
    
    // מחיר הנכס
    price: {
        type: Number,
        required: [true, 'מחיר הוא שדה חובה'],
        min: [0, 'מחיר לא יכול להיות שלילי'],
    },
    
    // מיקום הנכס
    location: {
        type: String,
        required: [true, 'מיקום הוא שדה חובה'],
        trim: true,
    },
    
    // סטטוס הנכס (זמין, נמכר, או לא זמין)
    status: {
        type: String,
        enum: ['available', 'sold', 'unavailable'], // רק הערכים האלה מותרים
        default: 'available',
    },
    
    // ID של המשתמש שיצר את הנכס
    // ref: 'User' - יוצר קשר למודל User
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
    // האם הנכס ציבורי (נראה לכל המשתמשים)
    isPublic: {
        type: Boolean,
        default: true, // ברירת מחדל - נכסים ציבוריים
    },
    
    // מספר טלפון ליצירת קשר
    phone: {
        type: String,
        trim: true,
    },
    
    // שדות נוספים
    rooms: {
        type: Number,
    },
    size: {
        type: Number, // במ"ר
    },
    type: {
        type: String,
        trim: true,
    },
    parking: {
        type: Boolean,
        default: false,
    },
    elevator: {
        type: Boolean,
        default: false,
    },
    balcony: {
        type: Boolean,
        default: false,
    },
    furnished: {
        type: Boolean,
        default: false,
    },
    pets: {
        type: Boolean,
        default: false,
    },
    airConditioner: {
        type: Boolean,
        default: false,
    },
    renovated: {
        type: Boolean,
        default: false,
    },
    accessibility: {
        type: Boolean,
        default: false,
    },
    
}, {
    timestamps: true, // מוסיף createdAt ו-updatedAt
});

// ========================================
// Indexes - משפר ביצועים בחיפושים
// ========================================
// Index על owner - מהיר למצוא נכסים לפי בעלים
propertySchema.index({ owner: 1 });
// Index על status - מהיר לסנן נכסים לפי סטטוס
propertySchema.index({ status: 1 });

// ייצוא המודל (Named Export)
export const Property = mongoose.model('Property', propertySchema);