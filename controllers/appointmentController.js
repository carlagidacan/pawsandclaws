const Appointment = require('../models/appointment');
const Pet = require('../models/pet');

// Service definitions
const services = {
    checkup: { id: 'checkup', name: 'General Checkup', duration: 30, price: 50 },
    vaccination: { id: 'vaccination', name: 'Vaccination', duration: 30, price: 75 },
    grooming: { id: 'grooming', name: 'Grooming', duration: 60, price: 45 },
    dental: { id: 'dental', name: 'Dental Cleaning', duration: 60, price: 120 },
    surgery: { id: 'surgery', name: 'Surgery Consultation', duration: 45, price: 150 }
};

// Add a new appointment
const addAppointment = async (req, res) => {
    try {
        const { petId, serviceId, dateTime, notes } = req.body;
        
        // Validate required fields
        if (!petId || !serviceId || !dateTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create new appointment with client ID
        const appointment = new Appointment({
            client: req.user.id, // Add client ID from auth
            pet: petId,
            service: serviceId,
            dateTime: new Date(dateTime),
            notes: notes || '',
            status: 'pending'
        });

        // Save appointment
        await appointment.save();

        console.log('Created appointment:', appointment); // Debug log

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment
        });

    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to book appointment',
            error: error.message
        });
    }
};

// Get all appointments for a user
const getUserAppointments = async (req, res) => {
    try {
        // Find appointments directly by client ID
        const appointments = await Appointment.find({
            client: req.user.id
        }).populate('pet');

        res.status(200).json({
            success: true,
            appointments: appointments
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: error.message
        });
    }
};

// Cancel an appointment
const cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;

        // Find the appointment
        const appointment = await Appointment.findById(appointmentId).populate('pet');
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check if the pet belongs to the user
        const pet = await Pet.findOne({ _id: appointment.pet._id, owner: req.user.id });
        if (!pet) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to cancel this appointment'
            });
        }

        // Update appointment status
        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel appointment',
            error: error.message
        });
    }
};

// Get available time slots for a specific date
const getAvailableTimeSlots = async (req, res) => {
    try {
        // Validate date parameter
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required'
            });
        }

        // Convert date string to Date object
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Set hours to 0 to get start of day
        selectedDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get start and end of the requested date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        // Find all appointments for the date
        const appointments = await Appointment.find({
            dateTime: {
                $gte: startDate,
                $lte: endDate
            }
        });

        // Extract booked time slots
        const bookedSlots = appointments.map(apt => {
            const time = apt.dateTime;
            return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        });

        res.status(200).json({
            success: true,
            bookedSlots: bookedSlots
        });
    } catch (error) {
        console.error('Error fetching available time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available time slots',
            error: error.message
        });
    }
};

// Update exports to include new function
module.exports = {
    addAppointment,
    getUserAppointments,
    cancelAppointment,
    getAvailableTimeSlots
};
