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

// Helper to count how many members currently occupy a given role in a team
const countMembersForRole = (team, role) => {
  if (!role) return 0;
  return team.members.filter((m) => m.role === role).length;
};

// Helper to check if there is remaining capacity for a role on a team
const hasCapacityForRole = (team, role) => {
  const normalizedRole = role || 'other';
  const currentCount = countMembersForRole(team, normalizedRole);
  const roleCap = team.roleCapacities?.[normalizedRole] || 0;

  // If a positive role capacity is set, enforce it.
  if (roleCap > 0 && currentCount >= roleCap) {
    return false;
  }

  // Always respect overall maxSize as well.
  if (team.members.length >= team.maxSize) {
    return false;
  }

  return true;
};

// Create team
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, hackathonId, description, lookingFor, quizQuestions, roleCapacities } = req.body;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Check if user is registered
    if (!hackathon.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You must register for the hackathon first' });
    }

    let formattedQuizQuestions = [];
    if (Array.isArray(quizQuestions)) {
      formattedQuizQuestions = quizQuestions
        .map((q) => {
          if (!q || typeof q.question !== 'string') return null;
          const question = q.question.trim();
          if (!question) return null;

          const options = Array.isArray(q.options)
            ? q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : '')).filter(Boolean)
            : [];

          if (options.length < 2) return null; // need at least 2 options

          let correctOptionIndex = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
          if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
            correctOptionIndex = 0;
          }

          // skillTag denotes which role/skill this question belongs to (e.g. 'frontend').
          const skillTag = typeof q.skillTag === 'string' && q.skillTag.trim()
            ? q.skillTag.trim().toLowerCase()
            : 'other';

          return {
            question,
            options,
            correctOptionIndex,
            skillTag,
          };
        })
        .filter(Boolean);
    }

    const team = new Team({
      name,
      hackathon: hackathonId,
      leader: req.user._id,
      description,
      lookingFor: lookingFor || [],
      quizQuestions: formattedQuizQuestions,
      roleCapacities: roleCapacities || {},
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

// Join team (instant join, only for teams without quiz)
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const selectedRole = role || 'other';
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // If quiz is configured, joining should go through the quiz application flow
    if (team.quizQuestions && team.quizQuestions.length > 0) {
      return res.status(400).json({ message: 'This team requires a quiz. Please apply instead.' });
    }

    // Check if already a member
    if (team.members.some(m => m.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already a member of this team' });
    }

    // Enforce per-role and overall capacity
    if (!hasCapacityForRole(team, selectedRole)) {
      return res.status(400).json({ message: `No seats available for role ${selectedRole} in this team` });
    }

    team.members.push({
      user: req.user._id,
      role: selectedRole
    });

    await team.save();

    // Notify team leader
    const leaderNotification = await Notification.create({
      user: team.leader,
      type: 'team',
      title: 'New Team Member',
      message: `${req.user.name} joined your team ${team.name}`,
      relatedId: team._id,
      relatedModel: 'Team'
    });

    // Emit real-time notification to team leader
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${team.leader.toString()}`).emit('notification', leaderNotification);
    }

    await team.populate('members.user', 'name email profile');
    await team.populate('leader', 'name email');

    res.json(team);
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply to team with quiz (role-based)
router.post('/:id/apply', authenticate, async (req, res) => {
  try {
    const { answers, role } = req.body;
    const selectedRole = (role || 'other').toLowerCase();
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if already a member
    if (
      team.leader.toString() === req.user._id.toString() ||
      team.members.some((m) => m.user.toString() === req.user._id.toString())
    ) {
      return res.status(400).json({ message: 'Already a member of this team' });
    }

    // Enforce overall and per-role capacity before doing any quiz work
    if (!hasCapacityForRole(team, selectedRole)) {
      return res.status(400).json({ message: `No seats available for role ${selectedRole} in this team` });
    }

    // If no quiz is defined at all, fall back to instant join behavior for this role
    if (!team.quizQuestions || team.quizQuestions.length === 0) {
      team.members.push({
        user: req.user._id,
        role: selectedRole,
      });

      await team.save();

      const leaderNotification = await Notification.create({
        user: team.leader,
        type: 'team',
        title: 'New Team Member',
        message: `${req.user.name} joined your team ${team.name}`,
        relatedId: team._id,
        relatedModel: 'Team',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user-${team.leader.toString()}`).emit('notification', leaderNotification);
      }

      await team.populate('members.user', 'name email profile');
      await team.populate('leader', 'name email');

      return res.json(team);
    }

    // Filter quiz questions for the selected role (skillTag)
    const roleQuestions = (team.quizQuestions || []).filter((q) => {
      const tag = (q.skillTag || 'other').toLowerCase();
      return tag === selectedRole;
    });

    // If there are no questions for this role, allow joining without quiz
    if (roleQuestions.length === 0) {
      team.members.push({
        user: req.user._id,
        role: selectedRole,
      });

      await team.save();

      const leaderNotification = await Notification.create({
        user: team.leader,
        type: 'team',
        title: 'New Team Member',
        message: `${req.user.name} joined your team ${team.name}`,
        relatedId: team._id,
        relatedModel: 'Team',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user-${team.leader.toString()}`).emit('notification', leaderNotification);
      }

      await team.populate('members.user', 'name email profile');
      await team.populate('leader', 'name email');

      return res.json(team);
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Answers are required for the quiz' });
    }

    // Prevent multiple pending applications from same user
    const existingPending = team.applications.find(
      (app) => app.user.toString() === req.user._id.toString() && app.status === 'pending'
    );
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending application for this team' });
    }

    const answerMap = new Map();
    answers.forEach((a) => {
      if (a && a.questionId) {
        answerMap.set(a.questionId.toString(), a.selectedIndex);
      }
    });

    // Ensure every role-specific quiz question has an answer
    const missingQuestions = roleQuestions.filter(
      (q) => !answerMap.has(q._id.toString())
    );
    if (missingQuestions.length > 0) {
      return res.status(400).json({ message: 'All quiz questions for this role must be answered' });
    }

    let score = 0;
    const storedAnswers = roleQuestions.map((q) => {
      const selectedIndex = answerMap.get(q._id.toString());
      if (typeof selectedIndex !== 'number') {
        return null;
      }
      if (selectedIndex === q.correctOptionIndex) {
        score += 1;
      }
      return {
        questionId: q._id,
        selectedIndex,
      };
    }).filter(Boolean);

    const totalQuestions = roleQuestions.length;
    const minPassing = Math.ceil(totalQuestions * 0.6); // 60% threshold
    const passed = score >= minPassing;

    const application = {
      user: req.user._id,
      role: selectedRole,
      answers: storedAnswers,
      score,
      passed,
      status: 'pending',
    };

    team.applications.push(application);
    await team.save();

    // Notify team leader about new application
    const leaderNotification = await Notification.create({
      user: team.leader,
      type: 'team',
      title: 'New Team Application',
      message: `${req.user.name} applied to join your team ${team.name} (Score: ${score}/${team.quizQuestions.length}).`,
      relatedId: team._id,
      relatedModel: 'Team',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${team.leader.toString()}`).emit('notification', leaderNotification);
    }

    res.status(201).json({ message: 'Application submitted', score });
  } catch (error) {
    console.error('Apply to team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get applications for a team (visible to all team members and leader)
router.get('/:id/applications', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('applications.user', 'name email profile');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    const isMember = team.members.some((m) => m.user.toString() === req.user._id.toString());

    if (!isLeader && !isMember) {
      return res.status(403).json({ message: 'Only team members can view applications' });
    }

    res.json({
      applications: team.applications,
      quizQuestions: team.quizQuestions,
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Decide on an application (leader only)
router.post('/:id/applications/:appId/decide', authenticate, async (req, res) => {
  try {
    const { action } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can decide applications' });
    }

    const application = team.applications.id(req.params.appId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application has already been processed' });
    }

    if (action === 'accept') {
      // Ensure still space and not already a member
      if (team.members.length >= team.maxSize) {
        return res.status(400).json({ message: 'Team is full' });
      }

      if (
        team.members.some((m) => m.user.toString() === application.user.toString()) ||
        team.leader.toString() === application.user.toString()
      ) {
        return res.status(400).json({ message: 'User is already in the team' });
      }

      const appRole = (application.role || 'other').toLowerCase();
      if (!hasCapacityForRole(team, appRole)) {
        return res.status(400).json({ message: `No seats available for role ${appRole} in this team` });
      }

      team.members.push({
        user: application.user,
        role: appRole,
      });

      application.status = 'accepted';

      // Notify user about acceptance
      const acceptedNotification = await Notification.create({
        user: application.user,
        type: 'team',
        title: 'Team Application Accepted',
        message: `Your application to join team ${team.name} has been accepted.`,
        relatedId: team._id,
        relatedModel: 'Team',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user-${application.user.toString()}`).emit('notification', acceptedNotification);
      }
    } else if (action === 'reject') {
      application.status = 'rejected';

      const rejectedNotification = await Notification.create({
        user: application.user,
        type: 'team',
        title: 'Team Application Rejected',
        message: `Your application to join team ${team.name} has been rejected.`,
        relatedId: team._id,
        relatedModel: 'Team',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user-${application.user.toString()}`).emit('notification', rejectedNotification);
      }
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await team.save();

    await team.populate('members.user', 'name email profile');

    res.json({
      message: 'Application processed',
      applications: team.applications,
      members: team.members,
    });
  } catch (error) {
    console.error('Decide application error:', error);
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
    const removedNotification = await Notification.create({
      user: req.params.userId,
      type: 'team',
      title: 'Removed from Team',
      message: `You have been removed from team ${team.name}.`,
      relatedId: team._id,
      relatedModel: 'Team'
    });

    // Emit real-time notification to removed member
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.params.userId}`).emit('notification', removedNotification);
    }

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
    const inviteNotification = await Notification.create({
      user: userId,
      type: 'team',
      title: 'Team Invitation',
      message: `${req.user.name} has invited you to join team ${team.name}.`,
      relatedId: team._id,
      relatedModel: 'Team'
    });

    // Emit real-time invitation notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('notification', inviteNotification);
    }

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


