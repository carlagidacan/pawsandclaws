const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    service: {
        type: String,
        required: true,
        enum: ['checkup', 'vaccination', 'grooming', 'dental', 'surgery']
    },
    dateTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for querying appointments by client and date range
appointmentSchema.index({ client: 1, dateTime: 1, status: 1 });

// Make sure appointments can't be double-booked
appointmentSchema.index(
    { dateTime: 1 }, 
    { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
