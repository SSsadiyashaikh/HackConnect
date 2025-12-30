import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['student', 'organizer'],
        default: 'student'
    },
    skills: [{
        type: String
    }],
    interests: [{
        type: String
    }],
    experience: {
        type: String
    },
    availability: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    ratings: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Update average rating
userSchema.methods.updateAverageRating = function () {
    if (this.ratings.length === 0) {
        this.averageRating = 0;
    } else {
        const sum = this.ratings.reduce((acc, curr) => acc + curr.rating, 0);
        this.averageRating = sum / this.ratings.length;
    }
};

const User = mongoose.model('User', userSchema);

export default User;
