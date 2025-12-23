import mongoose from 'mongoose';

const hackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile Development', 'AI/ML', 'Blockchain', 'IoT', 'Cybersecurity', 'Data Science', 'Game Development', 'Other']
  },
  location: {
    type: String,
    required: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: null
  },
  maxTeamSize: {
    type: Number,
    default: 4
  },
  minTeamSize: {
    type: Number,
    default: 1
  },
  skillRequirements: [String],
  prizes: [{
    position: String,
    prize: String
  }],
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  image: String,
  website: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update status based on dates
hackathonSchema.methods.updateStatus = function() {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'ongoing';
  } else {
    this.status = 'completed';
  }
};

export default mongoose.model('Hackathon', hackathonSchema);


