const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'other']
    },
    breed: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female']
    },
    birthdate: Date,
    age: Number,
    description: String,
    avatarUrl: String,
    weight: {
        type: Number,
        min: 0
    },
    microchipId: String,
    isSpayed: Boolean,
    vaccinations: {
        rabies: Boolean,
        dhp: Boolean,
        bordetella: Boolean
    },
    allergies: String,
    medicalConditions: String,
    temperament: {
        type: String,
        enum: ['calm', 'friendly', 'shy', 'energetic', 'aggressive']
    },
    activityLevel: {
        type: String,
        enum: ['low', 'moderate', 'high']
    },
    behavior: {
        goodWithDogs: Boolean,
        goodWithCats: Boolean,
        goodWithKids: Boolean
    },
    notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Pet', petSchema);
