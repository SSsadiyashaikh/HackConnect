import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import Hackathon from '../models/Hackathon.js';

const router = express.Router();

// Get all notifications for user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create deadline reminders (can be called by cron job)
router.post('/reminders/deadlines', async (req, res) => {
  try {
    const hackathons = await Hackathon.find({
      registrationDeadline: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
      }
    }).populate('participants');

    for (const hackathon of hackathons) {
      for (const participant of hackathon.participants) {
        await Notification.create({
          user: participant._id,
          type: 'deadline',
          title: 'Registration Deadline Approaching',
          message: `The registration deadline for ${hackathon.title} is approaching!`,
          relatedId: hackathon._id,
          relatedModel: 'Hackathon'
        });
      }
    }

    res.json({ message: 'Reminders created', count: hackathons.length });
  } catch (error) {
    console.error('Create reminders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


