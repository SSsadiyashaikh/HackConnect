import express from 'express';
import { body, validationResult } from 'express-validator';
import Hackathon from '../models/Hackathon.js';
import { authenticate, isOrganizer } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

const router = express.Router();

// Get all hackathons with filters
router.get('/', async (req, res) => {
  try {
    const { domain, location, date, skill, search } = req.query;
    let query = {};

    if (domain) query.domain = domain;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (skill) query.skillRequirements = { $in: [skill] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (date) {
      const dateFilter = new Date(date);
      query.startDate = { $gte: dateFilter };
    }

    const hackathons = await Hackathon.find(query)
      .populate('organizer', 'name email')
      .populate('participants', 'name email')
      .sort({ startDate: 1 });

    // Update status for each hackathon
    hackathons.forEach(hackathon => hackathon.updateStatus());

    res.json(hackathons);
  } catch (error) {
    console.error('Get hackathons error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single hackathon
router.get('/:id', async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('participants', 'name email profile')
      .populate('teams', 'name leader members');

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    hackathon.updateStatus();
    await hackathon.save();

    res.json(hackathon);
  } catch (error) {
    console.error('Get hackathon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create hackathon (Organizer only)
router.post('/', authenticate, isOrganizer, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('domain').notEmpty().withMessage('Domain is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('registrationDeadline').isISO8601().withMessage('Valid registration deadline is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const hackathon = new Hackathon({
      ...req.body,
      organizer: req.user._id
    });

    await hackathon.save();
    await hackathon.populate('organizer', 'name email');

    res.status(201).json(hackathon);
  } catch (error) {
    console.error('Create hackathon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update hackathon (Organizer only)
router.put('/:id', authenticate, isOrganizer, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    if (hackathon.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(hackathon, req.body);
    await hackathon.save();
    await hackathon.populate('organizer', 'name email');

    res.json(hackathon);
  } catch (error) {
    console.error('Update hackathon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register for hackathon
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    if (hackathon.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already registered' });
    }

    if (hackathon.maxParticipants && hackathon.participants.length >= hackathon.maxParticipants) {
      return res.status(400).json({ message: 'Hackathon is full' });
    }

    hackathon.participants.push(req.user._id);
    await hackathon.save();

    // Create notification for the participant
    await Notification.create({
      user: req.user._id,
      type: 'hackathon',
      title: 'Registration Successful',
      message: `You have successfully registered for ${hackathon.title}`,
      relatedId: hackathon._id,
      relatedModel: 'Hackathon'
    });

    // Suggest this participant to team leaders who are looking for matching skills
    try {
      const user = await User.findById(req.user._id);
      const userSkills = user.profile?.skills?.map(s => s.name.toLowerCase()) || [];

      if (userSkills.length > 0) {
        const teams = await Team.find({ hackathon: hackathon._id });

        const matchingTeams = teams.filter(team => {
          if (team.members.length >= team.maxSize) return false;
          if (team.members.some(m => m.user.toString() === req.user._id.toString())) return false;

          const lookingFor = team.lookingFor?.map(s => s.toLowerCase()) || [];
          if (lookingFor.length === 0) return false;

          return userSkills.some(skill =>
            lookingFor.some(lf => lf.includes(skill) || skill.includes(lf))
          );
        });

        await Promise.all(
          matchingTeams.map(team =>
            Notification.create({
              user: team.leader,
              type: 'team',
              title: 'Potential Team Member Match',
              message: `${user.name} has registered for ${hackathon.title} and matches your required skills for team ${team.name}.`,
              relatedId: team._id,
              relatedModel: 'Team'
            })
          )
        );
      }
    } catch (matchError) {
      console.error('Error creating team match notifications:', matchError);
    }

    res.json({ message: 'Registered successfully', hackathon });
  } catch (error) {
    console.error('Register hackathon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unregister from hackathon
router.delete('/:id/register', authenticate, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    hackathon.participants = hackathon.participants.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await hackathon.save();

    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    console.error('Unregister hackathon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete hackathon (Organizer only)
router.delete('/:id', authenticate, isOrganizer, async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    if (hackathon.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await hackathon.deleteOne();
    res.json({ message: 'Hackathon deleted successfully' });
  } catch (error) {
    console.error('Delete hackathon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

