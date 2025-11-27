import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { Property } from '../models/Property.js';

const router = express.Router();

// ========================================
// GET /api/favorites - קבלת כל המועדפים של המשתמש
// ========================================
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    res.json({
      favorites: user.favorites || [],
      favoriteIds: user.favorites?.map(p => p._id.toString()) || []
    });
  } catch (error) {
    console.error('❌ שגיאה בטעינת מועדפים:', error);
    res.status(500).json({ message: 'שגיאה בטעינת מועדפים' });
  }
});

// ========================================
// POST /api/favorites/:propertyId - הוספת/הסרת נכס למועדפים (toggle)
// ========================================
router.post('/:propertyId', protect, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // בדיקה אם הנכס קיים
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'נכס לא נמצא' });
    }

    // Toggle - אם קיים הסר, אם לא קיים הוסף
    const index = user.favorites.indexOf(propertyId);
    let action;
    
    if (index > -1) {
      user.favorites.splice(index, 1);
      action = 'removed';
    } else {
      user.favorites.push(propertyId);
      action = 'added';
    }

    await user.save();

    res.json({
      message: action === 'added' ? 'הנכס נוסף למועדפים' : 'הנכס הוסר מהמועדפים',
      favoriteIds: user.favorites.map(id => id.toString()),
      action
    });
  } catch (error) {
    console.error('❌ שגיאה בעדכון מועדפים:', error);
    res.status(500).json({ message: 'שגיאה בעדכון מועדפים' });
  }
});

export default router;