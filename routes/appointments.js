const express = require('express');
const router = express.Router();
const { 
    addAppointment, 
    getUserAppointments, 
    cancelAppointment,
    getAvailableTimeSlots 
} = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const Appointment = require('../models/appointment');
const Pet = require('../models/pet');
const User = require('../models/user');

// Add a new appointment (protected route)
router.post('/add', auth, addAppointment);

// Get available time slots
router.get('/available-slots', auth, getAvailableTimeSlots);

// Get user's appointments (protected route)
router.get('/user-appointments', auth, async (req, res) => {
    try {
        // Get appointments directly using client ID from auth
        const appointments = await Appointment.find({ 
            client: req.user.id 
        })
        .populate('pet')
        .sort({ dateTime: 1 });

        console.log('Found appointments:', appointments); // Debug log

        const formattedAppointments = appointments.map(appt => ({
            _id: appt._id,
            dateTime: appt.dateTime,
            pet: appt.pet.name,
            service: appt.service,
            status: appt.status,
            notes: appt.notes || ''
        }));

        console.log('Formatted appointments:', formattedAppointments); // Debug log

        res.json({
            success: true,
            appointments: formattedAppointments
        });

    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch appointments' 
        });
    }
});

// Cancel appointment (protected route)
router.delete('/:id/cancel', auth, cancelAppointment);

// Get upcoming appointments
router.get('/upcoming', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointments = await Appointment.find({
            dateTime: { $gte: today }
        })
        .sort({ dateTime: 1 })
        .limit(5)
        .populate({
            path: 'pet',
            populate: {
                path: 'owner',
                select: 'firstName lastName'
            }
        });        const formattedAppointments = appointments.map(appt => ({
            dateTime: appt.dateTime,
            client: `${appt.pet.owner.firstName} ${appt.pet.owner.lastName}`,
            pet: `${appt.pet.name} (${appt.pet.type})`,
            service: appt.service,
            status: appt.status,
            notes: appt.notes
        }));

        res.json(formattedAppointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Failed to fetch appointments' });
    }
});

// Fetch appointments for the upcoming week
router.get('/fetch-appointments', async (req, res) => {
    try {
        const query = `
            SELECT 
                appointments.appointment_time,
                CONCAT(clients.first_name, ' ', clients.last_name) as client_name,
                pets.name as pet_name,
                services.name as service_name,
                appointments.status
            FROM appointments
            JOIN clients ON appointments.client_id = clients.id
            JOIN pets ON appointments.pet_id = pets.id
            JOIN services ON appointments.service_id = services.id
            WHERE appointments.appointment_time >= NOW()
            ORDER BY appointments.appointment_time ASC
            LIMIT 5`;

        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Error fetching appointments' });
    }
});

module.exports = router;