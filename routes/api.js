const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const Order = require('../models/order');
const User = require('../models/user');
const Pet = require('../models/pet');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [appointmentsCount, pendingOrdersCount, newClientsCount, revenue] = await Promise.all([
            Appointment.countDocuments({ dateTime: { $gte: today } }),
            Order.countDocuments({ status: "pending" }),
            User.countDocuments({ createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } }),
            Order.aggregate([
                { $match: { createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ])
        ]);

        res.json({
            todayAppointments: appointmentsCount,
            pendingOrders: pendingOrdersCount,
            newClients: newClientsCount,
            revenue: revenue[0] ? revenue[0].total : 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get appointments
router.get('/appointments', async (req, res) => {
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
                model: 'User',
                select: 'firstName lastName'
            }
        });

        // Transform the data to match the expected format
        const formattedAppointments = appointments.map(appt => ({
            time: appt.dateTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            client: `${appt.pet.owner.firstName} ${appt.pet.owner.lastName}`,
            pet: `${appt.pet.name} (${appt.pet.type})`,
            service: appt.service,
            status: appt.status
        }));

        res.json(formattedAppointments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get recent orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('client', 'firstName lastName')
            .populate('orderItems.product', 'name');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router;
