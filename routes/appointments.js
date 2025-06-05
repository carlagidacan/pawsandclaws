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


router.post('/add', auth, async (req, res) => {
    try {
        console.log('Received appointment data:', req.body);
        console.log('Authenticated user:', req.user); // Debug log

        const { dateTime, pet, service, notes } = req.body;

        if (!dateTime || !pet || !service) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create appointment with client ID from authenticated user
        const appointment = new Appointment({
            dateTime: new Date(dateTime),
            client: req.user.id, // Add client ID from auth
            pet: pet,
            service: service,
            status: 'pending',
            notes: notes || ''
        });

        console.log('Creating appointment:', appointment);

        const savedAppointment = await appointment.save();
        await savedAppointment.populate(['pet', 'client']); // Populate both pet and client

        console.log('Appointment created:', savedAppointment);

        res.json({
            success: true,
            message: 'Appointment created successfully',
            appointment: savedAppointment
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create appointment',
            error: error.message
        });
    }
});


router.get('/available-slots', auth, getAvailableTimeSlots);


router.get('/user-appointments', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({
            client: req.user.id
        })
            .populate({
                path: 'pet',
                select: 'name type breed'
            })
            .sort({ dateTime: 1 });

        const formattedAppointments = appointments.map(appt => ({
            _id: appt._id,
            dateTime: appt.dateTime,
            pet: appt.pet ? {
                name: appt.pet.name,
                type: appt.pet.type,
                breed: appt.pet.breed
            } : null,
            service: appt.service,
            status: appt.status,
            notes: appt.notes || ''
        }));

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


router.delete('/:id/cancel', auth, cancelAppointment);


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
            });

        const formattedAppointments = appointments.map(appt => ({
            dateTime: appt.dateTime,
            client: `${appt.pet.owner.firstName} ${appt.pet.owner.lastName}`,
            pet: `${appt.pet.name} (${appt.pet.type})`,
            service: appt.service,
            status: appt.status,
            notes: appt.notes
        }));

        res.json(formattedAppointments);

    } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        res.status(500).json({ message: 'Failed to fetch appointments' });
    }
});

router.get('/all', async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .sort({ dateTime: 1 })
            .populate('pet')
            .populate('client'); // Ensure your model references 'client' as User

        const formattedAppointments = appointments.map(appt => ({
            _id: appt._id,
            dateTime: appt.dateTime,
            client: appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : 'Unknown Client',
            pet: appt.pet ? `${appt.pet.name} (${appt.pet.type})` : 'Unknown Pet',
            service: appt.service || 'Not specified',
            status: appt.status || 'pending',
            notes: appt.notes || ''
        }));

        res.json(formattedAppointments);

    } catch (error) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments'
        });
    }
});

// -----------------------------
// (Optional) MySQL demo fetch (you can remove if unused)
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

router.put('/update-status/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = req.body.status;
        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment status updated successfully',
            appointment
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment status'
        });
    }
});

// Add delete appointment route
router.delete('/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete appointment'
        });
    }
});

// Update route to get all clients
router.get('/get-clients', async (req, res) => {
    try {
        // Find all users that are not admins or vets
        const clients = await User.find({
            $or: [
                { role: { $exists: false } },
                { role: 'client' },
                { role: { $nin: ['admin', 'veterinarian'] } }
            ]
        }).select('_id firstName lastName email');

        if (!clients || clients.length === 0) {
            return res.json({
                success: true,
                clients: []
            });
        }
        
        res.json({
            success: true,
            clients: clients
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch clients' 
        });
    }
});

// Update route to get pets by client
router.get('/get-pets/:clientId', async (req, res) => {
    try {
        const clientId = req.params.clientId;
        console.log('Client ID received:', clientId); // Debug log

        const pets = await Pet.find({ 
            owner: clientId 
        });
        
        console.log('Pets found:', pets); // Debug log

        if (!pets || pets.length === 0) {
            console.log('No pets found for client:', clientId); // Debug log
            return res.json({
                success: true,
                pets: []
            });
        }

        res.json({
            success: true,
            pets: pets.map(pet => ({
                _id: pet._id,
                name: pet.name,
                type: pet.type
            }))
        });
    } catch (error) {
        console.error('Error in get-pets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pets',
            error: error.message
        });
    }
});

module.exports = router;
