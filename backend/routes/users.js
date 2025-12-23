import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('ratings.from', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/me/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('ratings.from', 'name');

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/me/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.profile) {
      user.profile = { ...user.profile, ...req.body.profile };
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    await user.save();
    await user.populate('ratings.from', 'name');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rate a user
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot rate yourself' });
    }

    // Remove existing rating from this user
    user.ratings = user.ratings.filter(
      r => r.from.toString() !== req.user._id.toString()
    );

    // Add new rating
    user.ratings.push({
      from: req.user._id,
      rating,
      comment
    });

    user.updateAverageRating();
    await user.save();

    res.json({ message: 'Rating submitted successfully', user });
  } catch (error) {
    console.error('Rate user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user suggestions for team formation
router.get('/suggestions/team/:hackathonId', authenticate, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const hackathon = await (await import('../models/Hackathon.js')).default;
    const hackathonData = await hackathon.findById(req.params.hackathonId)
      .populate('participants', 'name email profile');

    if (!hackathonData) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    const currentUserSkills = currentUser.profile?.skills?.map(s => s.name.toLowerCase()) || [];
    const currentUserInterests = currentUser.profile?.interests?.map(i => i.toLowerCase()) || [];

    // Find users with complementary skills
    const suggestions = hackathonData.participants
      .filter(p => p._id.toString() !== req.user._id.toString())
      .map(participant => {
        const participantSkills = participant.profile?.skills?.map(s => s.name.toLowerCase()) || [];
        const participantInterests = participant.profile?.interests?.map(i => i.toLowerCase()) || [];

        // Calculate compatibility score
        const skillMatch = participantSkills.filter(s => !currentUserSkills.includes(s)).length;
        const interestMatch = participantInterests.filter(i => currentUserInterests.includes(i)).length;
        const score = skillMatch * 2 + interestMatch;

        return {
          user: participant,
          score,
          complementarySkills: participantSkills.filter(s => !currentUserSkills.includes(s))
        };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => s.user);

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


