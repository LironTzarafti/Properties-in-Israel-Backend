import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// ========================================
// @desc    הרשמת משתמש חדש
// @route   POST /api/auth/register
// @access  Public
// ========================================
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        // ולידציה - בדיקה שכל השדות התקבלו
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'נא למלא את כל השדות' 
            });
        }
        
        // בדיקה אם המשתמש כבר קיים
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({ 
                message: 'משתמש עם אימייל זה כבר קיים במערכת' 
            });
        }
        
        // יצירת משתמש חדש
        const user = await User.create({
            name,
            email,
            password
        });
        
        // אם המשתמש נוצר בהצלחה
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error('שגיאה בהרשמה:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    התחברות משתמש
// @route   POST /api/auth/login
// @access  Public
// ========================================
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // ולידציה
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'נא למלא אימייל וסיסמה' 
            });
        }
        
        // חיפוש משתמש לפי אימייל
        const user = await User.findOne({ email });
        
        // בדיקת קיום משתמש ובדיקת סיסמה
        if (user && (await user.comparePassword(password))) {
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ 
                message: 'אימייל או סיסמה שגויים' 
            });
        }
    } catch (error) {
        console.error('שגיאה בהתחברות:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    קבלת פרטי משתמש מחובר
// @route   GET /api/auth/me
// @access  Private (דורש אימות)
// ========================================
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                message: 'משתמש לא נמצא' 
            });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error('שגיאה בקבלת פרטי משתמש:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    עדכון פרופיל משתמש
// @route   PUT /api/auth/profile
// @access  Private
// ========================================
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                message: 'משתמש לא נמצא' 
            });
        }
        
        // עדכון העדפות אם נשלחו
        if (req.body.preferences) {
            user.preferences = {
                ...user.preferences,
                ...req.body.preferences
            };
        }
        
        // עדכון שדות נוספים אם נשלחו
        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.email !== undefined) user.email = req.body.email;
        if (req.body.phone !== undefined) user.phone = req.body.phone;
        if (req.body.address !== undefined) user.address = req.body.address;
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        
        await user.save();
        
        const updatedUser = await User.findById(user._id).select('-password');
        
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('שגיאה בעדכון פרופיל:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};

// ========================================
// @desc    התנתקות
// @route   POST /api/auth/logout
// @access  Private
// ========================================
export const logoutUser = async (req, res) => {
    res.status(200).json({ 
        message: 'התנתקת בהצלחה' 
    });
};

// ========================================
// @desc    מחיקת חשבון המשתמש המחובר - 🆕 חדש
// @route   DELETE /api/auth/account
// @access  Private
// ========================================
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id; // מגיע מה-middleware
        
        // 🔴 אופציונלי: מחיקת כל הנכסים של המשתמש
        // אם יש לך מודל Property, הסר את ההערה מהשורה הבאה:
        // await Property.deleteMany({ owner: userId });
        
        // מחיקת המשתמש
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({ 
                message: 'משתמש לא נמצא' 
            });
        }
        
        res.status(200).json({ 
            message: 'החשבון נמחק בהצלחה' 
        });
    } catch (error) {
        console.error('שגיאה במחיקת חשבון:', error);
        res.status(500).json({ 
            message: 'שגיאת שרת: ' + error.message 
        });
    }
};