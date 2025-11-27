import mongoose from 'mongoose';

// ========================================
// Schema של התראה
// ========================================
const notificationSchema = new mongoose.Schema({
    // המשתמש שהתראה שייכת אליו
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, // Index למהירות חיפוש
    },
    
    // סוג ההתראה
    type: {
        type: String,
        enum: ['new_property', 'property_match', 'property_update', 'system'],
        required: true,
    },
    
    // כותרת ההתראה
    title: {
        type: String,
        required: true,
        trim: true,
    },
    
    // תוכן ההתראה
    message: {
        type: String,
        required: true,
        trim: true,
    },
    
    // קישור לנכס (אם רלוונטי)
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
    },
    
    // האם ההתראה נקראה
    read: {
        type: Boolean,
        default: false,
    },
    
    // תאריך קריאה
    readAt: {
        type: Date,
    },
}, {
    timestamps: true, // מוסיף createdAt ו-updatedAt
});

// Index על user ו-read למהירות חיפוש
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 }); // מיון לפי תאריך

// ייצוא המודל
export default mongoose.model('Notification', notificationSchema);

