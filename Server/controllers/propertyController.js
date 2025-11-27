import { Property } from '../models/Property.js';
import { createNotificationsForNewProperty, createNotificationsForUpdatedProperty, deleteNotificationsForProperty } from './notificationController.js';

// ========================================
// @desc    קבלת כל הנכסים הציבוריים (למשתמשים לא מחוברים)
// @route   GET /api/properties/public
// @access  Public
// ========================================
export const getPublicProperties = async (req, res) => {
    try {
        // שליפת כל הנכסים הציבוריים מה-DB (רק נכסים עם isPublic = true)
        const properties = await Property.find({ isPublic: true })
            .populate('owner', 'name email')
            .sort({ createdAt: -1 }); // מיון לפי תאריך (החדשים ראשונים)
        
        res.status(200).json({
            count: properties.length,
            properties
        });
    } catch (error) {
        console.error('שגיאה בשליפת נכסים ציבוריים:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    קבלת כל הנכסים של המשתמש המחובר
// @route   GET /api/properties
// @access  Private
// ========================================
export const getMyProperties = async (req, res) => {
    try {
        // שליפת כל הנכסים של המשתמש מה-DB
        // populate('owner', 'name email') - מביא גם את פרטי הבעלים
        const properties = await Property.find({ owner: req.user._id })
            .populate('owner', 'name email')
            .sort({ createdAt: -1 }); // מיון לפי תאריך (החדשים ראשונים)
        
        res.status(200).json({
            count: properties.length,
            properties
        });
    } catch (error) {
        console.error('שגיאה בשליפת נכסים:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    קבלת נכס בודד לפי ID
// @route   GET /api/properties/:id
// @access  Private
// ========================================
export const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('owner', 'name email');
        
        if (!property) {
            return res.status(404).json({ 
                message: 'נכס לא נמצא' 
            });
        }
        
        // בדיקה שהנכס שייך למשתמש המחובר
        if (property.owner._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'אין לך הרשאה לצפות בנכס זה' 
            });
        }
        
        res.status(200).json(property);
    } catch (error) {
        console.error('שגיאה בשליפת נכס:', error);
        
        // בדיקה אם ה-ID לא תקין
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ 
                message: 'נכס לא נמצא - ID לא תקין' 
            });
        }
        
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    יצירת נכס חדש
// @route   POST /api/properties
// @access  Private
// ========================================
export const createProperty = async (req, res) => {
    const { title, description, price, location, status } = req.body;
    
    try {
        // ולידציה
        if (!title || !description || !price || !location) {
            return res.status(400).json({ 
                message: 'נא למלא את כל השדות החובה' 
            });
        }
        
        // יצירת נכס חדש
        const property = await Property.create({
            title,
            description,
            price,
            location,
            status: status || 'available', // ברירת מחדל: זמין
            isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true, // ברירת מחדל: ציבורי
            phone: req.body.phone || '', // מספר טלפון
            rooms: req.body.rooms || undefined,
            size: req.body.size || undefined,
            type: req.body.type || '',
            parking: req.body.parking || false,
            elevator: req.body.elevator || false,
            balcony: req.body.balcony || false,
            furnished: req.body.furnished || false,
            pets: req.body.pets || false,
            airConditioner: req.body.airConditioner || false,
            renovated: req.body.renovated || false,
            accessibility: req.body.accessibility || false,
            owner: req.user._id // ID של המשתמש המחובר
        });
        
        // שליפת הנכס עם פרטי הבעלים
        const populatedProperty = await Property.findById(property._id)
            .populate('owner', 'name email');
        
        // יצירת התראות למשתמשים רלוונטיים (ברקע, לא חוסם את התגובה)
        createNotificationsForNewProperty(populatedProperty).catch(err => {
            console.error('שגיאה ביצירת התראות:', err);
        });
        
        res.status(201).json(populatedProperty);
    } catch (error) {
        console.error('שגיאה ביצירת נכס:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    עדכון נכס
// @route   PUT /api/properties/:id
// @access  Private
// ========================================
export const updateProperty = async (req, res) => {
    try {
        // חיפוש הנכס
        let property = await Property.findById(req.params.id);
        
        if (!property) {
            return res.status(404).json({ 
                message: 'נכס לא נמצא' 
            });
        }
        
        // בדיקה שהנכס שייך למשתמש המחובר
        if (property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'אין לך הרשאה לערוך נכס זה' 
            });
        }
        
        // שמירת הערכים הישנים לבדיקה
        const oldStatus = property.status;
        const oldLocation = property.location;
        const oldType = property.type;
        const oldIsPublic = property.isPublic;
        
        // עדכון הנכס
        property = await Property.findByIdAndUpdate(
            req.params.id,
            req.body,
            { 
                new: true, // מחזיר את המסמך המעודכן
                runValidators: true // מריץ את ה-validators של המודל
            }
        ).populate('owner', 'name email');
        
        // אם הנכס הפך ללא זמין או נמכר, מוחקים התראות קיימות
        if ((oldStatus === 'available' && (property.status === 'sold' || property.status === 'unavailable'))) {
            deleteNotificationsForProperty(property._id).catch(err => {
                console.error('שגיאה במחיקת התראות:', err);
            });
        }
        
        // בדיקה אם צריך ליצור התראות:
        // 1. אם הנכס הפך לזמין (מ-sold/unavailable ל-available)
        // 2. אם הנכס שינה מיקום או סוג
        // 3. אם הנכס הפך לציבורי
        const statusChangedToAvailable = oldStatus !== 'available' && property.status === 'available';
        const locationChanged = oldLocation !== property.location;
        const typeChanged = oldType !== property.type;
        const becamePublic = !oldIsPublic && property.isPublic;
        
        if ((statusChangedToAvailable || locationChanged || typeChanged || becamePublic) && property.isPublic && property.status === 'available') {
            // יצירת התראות למשתמשים רלוונטיים (ברקע, לא חוסם את התגובה)
            createNotificationsForUpdatedProperty(property, {
                statusChangedToAvailable,
                locationChanged,
                typeChanged,
                becamePublic
            }).catch(err => {
                console.error('שגיאה ביצירת התראות לעדכון נכס:', err);
            });
        }
        
        res.status(200).json(property);
    } catch (error) {
        console.error('שגיאה בעדכון נכס:', error);
        
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ 
                message: 'נכס לא נמצא - ID לא תקין' 
            });
        }
        
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    מחיקת נכס
// @route   DELETE /api/properties/:id
// @access  Private
// ========================================
export const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        
        if (!property) {
            return res.status(404).json({ 
                message: 'נכס לא נמצא' 
            });
        }
        
        // בדיקה שהנכס שייך למשתמש המחובר
        if (property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'אין לך הרשאה למחוק נכס זה' 
            });
        }
        
        // מחיקת הנכס
        await Property.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ 
            message: 'הנכס נמחק בהצלחה' 
        });
    } catch (error) {
        console.error('שגיאה במחיקת נכס:', error);
        
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ 
                message: 'נכס לא נמצא - ID לא תקין' 
            });
        }
        
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    עדכון סטטוס נכס (זמין/נמכר)
// @route   PATCH /api/properties/:id/status
// @access  Private
// ========================================
export const updatePropertyStatus = async (req, res) => {
    const { status } = req.body;
    
    try {
        // ולידציה של הסטטוס
        if (!status || !['available', 'sold', 'unavailable'].includes(status)) {
            return res.status(400).json({ 
                message: 'סטטוס לא תקין - אפשרויות: available, sold או unavailable' 
            });
        }
        
        const property = await Property.findById(req.params.id);
        
        if (!property) {
            return res.status(404).json({ 
                message: 'נכס לא נמצא' 
            });
        }
        
        // בדיקה שהנכס שייך למשתמש המחובר
        if (property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'אין לך הרשאה לעדכן נכס זה' 
            });
        }
        
        // שמירת הסטטוס הישן
        const oldStatus = property.status;
        
        // עדכון הסטטוס בלבד
        property.status = status;
        await property.save();
        
        // אם הנכס הפך ללא זמין או נמכר, מוחקים התראות קיימות
        if (oldStatus === 'available' && (status === 'sold' || status === 'unavailable')) {
            deleteNotificationsForProperty(property._id).catch(err => {
                console.error('שגיאה במחיקת התראות:', err);
            });
        }
        
        // אם הנכס הפך לזמין וציבורי, יוצרים התראות
        if (oldStatus !== 'available' && status === 'available' && property.isPublic) {
            const populatedProperty = await Property.findById(property._id)
                .populate('owner', 'name email');
            
            createNotificationsForUpdatedProperty(populatedProperty, {
                statusChangedToAvailable: true,
                locationChanged: false,
                typeChanged: false,
                becamePublic: false
            }).catch(err => {
                console.error('שגיאה ביצירת התראות לעדכון סטטוס:', err);
            });
        }
        
        res.status(200).json(property);
    } catch (error) {
        console.error('שגיאה בעדכון סטטוס:', error);
        
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ 
                message: 'נכס לא נמצא - ID לא תקין' 
            });
        }
        
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};