import express from 'express';
import Team from '../models/Team.js';
import Hackathon from '../models/Hackathon.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all teams for a hackathon
router.get('/hackathon/:hackathonId', async (req, res) => {
  try {
    const teams = await Team.find({ hackathon: req.params.hackathonId })
      .populate('leader', 'name email profile')
      .populate('members.user', 'name email profile')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single team
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email profile')
      .populate('members.user', 'name email profile')
      .populate('hackathon', 'title startDate endDate');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create team
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, hackathonId, description, lookingFor } = req.body;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Check if user is registered
    if (!hackathon.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You must register for the hackathon first' });
    }

    const team = new Team({
      name,
      hackathon: hackathonId,
      leader: req.user._id,
      description,
      lookingFor: lookingFor || [],
      members: [{
        user: req.user._id,
        role: 'other'
      }]
    });

    await team.save();
    hackathon.teams.push(team._id);
    await hackathon.save();

    await team.populate('leader', 'name email profile');
    await team.populate('hackathon', 'title');

    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join team
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if already a member
    if (team.members.some(m => m.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already a member of this team' });
    }

    // Check team size
    if (team.members.length >= team.maxSize) {
      return res.status(400).json({ message: 'Team is full' });
    }

    team.members.push({
      user: req.user._id,
      role: role || 'other'
    });

    await team.save();

    // Notify team leader
    await Notification.create({
      user: team.leader,
      type: 'team',
      title: 'New Team Member',
      message: `${req.user.name} joined your team ${team.name}`,
      relatedId: team._id,
      relatedModel: 'Team'
    });

    await team.populate('members.user', 'name email profile');
    await team.populate('leader', 'name email');

    res.json(team);
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave team
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Leader cannot leave. Transfer leadership first.' });
    }

    team.members = team.members.filter(
      m => m.user.toString() !== req.user._id.toString()
    );

    await team.save();
    res.json({ message: 'Left team successfully' });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove a member (Leader only)
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Only leader can remove members
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can remove members' });
    }

    // Leader cannot remove themselves here
    if (req.params.userId === team.leader.toString()) {
      return res.status(400).json({ message: 'Cannot remove team leader' });
    }

    const beforeCount = team.members.length;
    team.members = team.members.filter(
      m => m.user.toString() !== req.params.userId
    );

    if (team.members.length === beforeCount) {
      return res.status(404).json({ message: 'Member not found in team' });
    }

    await team.save();

    // Notify removed member
    await Notification.create({
      user: req.params.userId,
      type: 'team',
      title: 'Removed from Team',
      message: `You have been removed from team ${team.name}.`,
      relatedId: team._id,
      relatedModel: 'Team'
    });

    res.json({ message: 'Member removed from team' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign role (Leader only)
router.put('/:id/role', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can assign roles' });
    }

    const member = team.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await team.save();

    res.json(team);
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message in team chat
router.post('/:id/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member
    if (!team.members.some(m => m.user.toString() === req.user._id.toString()) &&
        team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You must be a team member to chat' });
    }

    team.chat.push({
      user: req.user._id,
      message
    });

    await team.save();
    await team.populate('chat.user', 'name email');

    res.json(team.chat);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Invite a user to join the team (Leader only)
router.post('/:id/invite', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can send invitations' });
    }

    // Cannot invite existing member or leader
    if (
      userId === team.leader.toString() ||
      team.members.some(m => m.user.toString() === userId)
    ) {
      return res.status(400).json({ message: 'User is already in the team' });
    }

    // Optional: check hackathon participants (only invite registered users)
    const hackathon = await Hackathon.findById(team.hackathon);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    if (!hackathon.participants.some(p => p.toString() === userId)) {
      return res.status(400).json({ message: 'User must be registered for the hackathon first' });
    }

    // Create notification as invitation
    await Notification.create({
      user: userId,
      type: 'team',
      title: 'Team Invitation',
      message: `${req.user.name} has invited you to join team ${team.name}.`,
      relatedId: team._id,
      relatedModel: 'Team'
    });

    res.json({ message: 'Invitation sent' });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get team suggestions based on skills (for students looking for teams)
router.get('/suggestions/:hackathonId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const teams = await Team.find({ hackathon: req.params.hackathonId })
      .populate('leader', 'name email profile')
      .populate('members.user', 'name email profile');

    // Filter teams that need skills matching user's skills
    const userSkills = user.profile?.skills?.map(s => s.name.toLowerCase()) || [];
    const suggestions = teams.filter(team => {
      if (team.members.length >= team.maxSize) return false;
      if (team.members.some(m => m.user._id.toString() === req.user._id.toString())) return false;

      const lookingFor = team.lookingFor?.map(s => s.toLowerCase()) || [];
      return userSkills.some(skill =>
        lookingFor.some(lf => lf.includes(skill) || skill.includes(lf))
      );
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get member suggestions for a team based on required skills
router.get('/:id/member-suggestions', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Only team leader can view suggested members
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can view suggestions' });
    }

    const hackathon = await Hackathon.findById(team.hackathon)
      .populate('participants', 'name email profile');

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    const teamMemberIds = new Set([
      team.leader.toString(),
      ...team.members.map(m => m.user.toString()),
    ]);

    const lookingFor = team.lookingFor?.map(s => s.toLowerCase()) || [];

    const suggestions = hackathon.participants.filter(participant => {
      // Skip existing team members
      if (teamMemberIds.has(participant._id.toString())) return false;

      const userSkills = participant.profile?.skills?.map(s => s.name.toLowerCase()) || [];
      if (userSkills.length === 0 || lookingFor.length === 0) return false;

      return userSkills.some(skill =>
        lookingFor.some(lf => lf.includes(skill) || skill.includes(lf))
      );
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Get member suggestions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


