import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { Property } from '../models/Property.js';

// ========================================
// @desc    קבלת כל ההתראות של המשתמש
// @route   GET /api/notifications
// @access  Private
// ========================================
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate('property', 'title location price type')
            .sort({ createdAt: -1 })
            .limit(50); // מקסימום 50 התראות
        
        const unreadCount = await Notification.countDocuments({ 
            user: req.user._id, 
            read: false 
        });
        
        res.status(200).json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('שגיאה בשליפת התראות:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    סימון התראה כנקראה
// @route   PUT /api/notifications/:id/read
// @access  Private
// ========================================
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ 
                message: 'התראה לא נמצאה' 
            });
        }
        
        // בדיקה שההתראה שייכת למשתמש המחובר
        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'אין לך הרשאה לעדכן התראה זו' 
            });
        }
        
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
        
        res.status(200).json(notification);
    } catch (error) {
        console.error('שגיאה בסימון התראה כנקראה:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    סימון כל ההתראות כנקראו
// @route   PUT /api/notifications/read-all
// @access  Private
// ========================================
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { 
                read: true, 
                readAt: new Date() 
            }
        );
        
        res.status(200).json({ 
            message: 'כל ההתראות סומנו כנקראו' 
        });
    } catch (error) {
        console.error('שגיאה בסימון כל ההתראות:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    מחיקת התראה
// @route   DELETE /api/notifications/:id
// @access  Private
// ========================================
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ 
                message: 'התראה לא נמצאה' 
            });
        }
        
        // בדיקה שההתראה שייכת למשתמש המחובר
        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'אין לך הרשאה למחוק התראה זו' 
            });
        }
        
        await Notification.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ 
            message: 'ההתראה נמחקה בהצלחה' 
        });
    } catch (error) {
        console.error('שגיאה במחיקת התראה:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// פונקציה עזר: יצירת התראות למשתמשים רלוונטיים
// ========================================
export const createNotificationsForNewProperty = async (property) => {
    try {
        console.log('🔔 [NOTIFICATIONS] בודק יצירת התראות עבור נכס:', property.title, 'ב-', property.location);
        
        // רק נכסים זמינים וציבוריים יוצרים התראות
        if (property.status !== 'available' || !property.isPublic) {
            console.log('🔔 [NOTIFICATIONS] נכס לא זמין או לא ציבורי - לא יוצרים התראות');
            return;
        }
        
        // שליפת כל המשתמשים עם העדפות
        const users = await User.find({
            'preferences.notificationSettings.newProperties': true
        });
        
        console.log(`🔔 [NOTIFICATIONS] נמצאו ${users.length} משתמשים עם התראות מופעלות`);
        
        let notificationsCreated = 0;
        
        for (const user of users) {
            // בדיקה אם הנכס תואם להעדפות המשתמש
            const matches = checkPropertyMatch(property, user.preferences);
            
            console.log(`🔔 [NOTIFICATIONS] משתמש ${user.email}: העדפות ערים:`, user.preferences?.preferredCities, 'סוגים:', user.preferences?.preferredPropertyTypes);
            console.log(`🔔 [NOTIFICATIONS] משתמש ${user.email}: נכס location:`, property.location, 'type:', property.type, 'התאמה:', matches);
            
            if (matches) {
                // יצירת התראה
                await Notification.create({
                    user: user._id,
                    type: 'new_property',
                    title: 'נכס חדש התואם להעדפותיך',
                    message: `נכס חדש נוסף: ${property.title} ב-${property.location}`,
                    property: property._id,
                    read: false
                });
                notificationsCreated++;
                console.log(`✅ [NOTIFICATIONS] נוצרה התראה למשתמש ${user.email}`);
            }
        }
        
        console.log(`✅ [NOTIFICATIONS] סה"כ נוצרו ${notificationsCreated} התראות`);
    } catch (error) {
        console.error('❌ [NOTIFICATIONS] שגיאה ביצירת התראות:', error);
    }
};

// ========================================
// פונקציה עזר: יצירת התראות לעדכון נכס
// ========================================
export const createNotificationsForUpdatedProperty = async (property, changes) => {
    try {
        console.log('🔔 [NOTIFICATIONS] בודק יצירת התראות לעדכון נכס:', property.title, 'ב-', property.location);
        console.log('🔔 [NOTIFICATIONS] שינויים:', changes);
        
        // רק אם הנכס זמין וציבורי
        if (property.status !== 'available' || !property.isPublic) {
            console.log('🔔 [NOTIFICATIONS] נכס לא זמין או לא ציבורי - לא יוצרים התראות');
            return;
        }
        
        // שליפת כל המשתמשים עם העדפות
        const users = await User.find({
            'preferences.notificationSettings.newProperties': true
        });
        
        console.log(`🔔 [NOTIFICATIONS] נמצאו ${users.length} משתמשים עם התראות מופעלות`);
        
        let notificationsCreated = 0;
        
        for (const user of users) {
            // בדיקה אם הנכס תואם להעדפות המשתמש
            const matches = checkPropertyMatch(property, user.preferences);
            
            console.log(`🔔 [NOTIFICATIONS] משתמש ${user.email}: העדפות ערים:`, user.preferences?.preferredCities, 'סוגים:', user.preferences?.preferredPropertyTypes);
            console.log(`🔔 [NOTIFICATIONS] משתמש ${user.email}: נכס location:`, property.location, 'type:', property.type, 'התאמה:', matches);
            
            if (matches) {
                // בדיקה אם כבר יש התראה על הנכס הזה למשתמש הזה (למנוע כפילויות)
                const existingNotification = await Notification.findOne({
                    user: user._id,
                    property: property._id,
                    type: 'new_property',
                    read: false
                });
                
                if (!existingNotification) {
                    // יצירת התראה
                    await Notification.create({
                        user: user._id,
                        type: 'new_property',
                        title: 'נכס חדש התואם להעדפותיך',
                        message: `נכס חדש נוסף: ${property.title} ב-${property.location}`,
                        property: property._id,
                        read: false
                    });
                    notificationsCreated++;
                    console.log(`✅ [NOTIFICATIONS] נוצרה התראה למשתמש ${user.email}`);
                } else {
                    console.log(`ℹ️ [NOTIFICATIONS] כבר יש התראה קיימת למשתמש ${user.email} על נכס זה`);
                }
            }
        }
        
        console.log(`✅ [NOTIFICATIONS] סה"כ נוצרו ${notificationsCreated} התראות לעדכון`);
    } catch (error) {
        console.error('❌ [NOTIFICATIONS] שגיאה ביצירת התראות לעדכון:', error);
    }
};

// ========================================
// פונקציה עזר: מחיקת התראות על נכס מסוים
// ========================================
export const deleteNotificationsForProperty = async (propertyId) => {
    try {
        const result = await Notification.deleteMany({ 
            property: propertyId,
            read: false // מוחקים רק התראות שלא נקראו
        });
        console.log(`🗑️ [NOTIFICATIONS] נמחקו ${result.deletedCount} התראות עבור נכס ${propertyId}`);
        return result;
    } catch (error) {
        console.error('❌ [NOTIFICATIONS] שגיאה במחיקת התראות:', error);
        throw error;
    }
};

// ========================================
// פונקציה עזר: בדיקה אם נכס תואם להעדפות משתמש
// ========================================
const checkPropertyMatch = (property, preferences) => {
    // אם אין העדפות, לא שולח התראה
    if (!preferences) return false;
    
    // אם אין העדפות כלל (רשימות ריקות), לא שולח התראה
    const hasCityPreferences = preferences.preferredCities && preferences.preferredCities.length > 0;
    const hasTypePreferences = preferences.preferredPropertyTypes && preferences.preferredPropertyTypes.length > 0;
    
    if (!hasCityPreferences && !hasTypePreferences) {
        return false;
    }
    
    let matches = false;
    
    // בדיקת עיר - אם יש העדפות ערים, צריך התאמה
    if (hasCityPreferences) {
        const cityMatch = preferences.preferredCities.some(city => {
            // בדיקה מדויקת יותר - גם כולל וגם שווה
            const location = property.location ? property.location.toLowerCase().trim() : '';
            const cityLower = city.toLowerCase().trim();
            return location.includes(cityLower) || location === cityLower;
        });
        if (cityMatch) matches = true;
    }
    
    // בדיקת סוג נכס - אם יש העדפות סוגים, צריך התאמה
    if (hasTypePreferences) {
        const typeMatch = preferences.preferredPropertyTypes.some(type => {
            const propType = property.type ? property.type.trim() : '';
            const prefType = type.trim();
            return propType === prefType || propType.includes(prefType);
        });
        if (typeMatch) matches = true;
    }
    
    // אם יש העדפות בשני השדות, צריך התאמה לפחות באחד מהם
    // אם יש רק באחד, מספיק התאמה באחד
    if (hasCityPreferences && hasTypePreferences) {
        const cityMatch = preferences.preferredCities.some(city => {
            const location = property.location ? property.location.toLowerCase().trim() : '';
            const cityLower = city.toLowerCase().trim();
            return location.includes(cityLower) || location === cityLower;
        });
        const typeMatch = preferences.preferredPropertyTypes.some(type => {
            const propType = property.type ? property.type.trim() : '';
            const prefType = type.trim();
            return propType === prefType || propType.includes(prefType);
        });
        // אם יש העדפות בשניהם, צריך התאמה לפחות באחד
        return cityMatch || typeMatch;
    }
    
    return matches;
};

