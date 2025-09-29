const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');

const router = express.Router();

router.use(verifyToken);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);
router.delete('/notifications/:id', deleteNotification);
router.delete('/notifications', deleteAllNotifications);

module.exports = router;