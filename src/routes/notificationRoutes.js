const express = require('express');
const verifyToken = require('../middleware/authMiddleware.js');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController.js');

const router = express.Router();

router.use(verifyToken);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);
router.delete('/notifications/:id', deleteNotification);
router.delete('/notifications', deleteAllNotifications);

module.exports = router;