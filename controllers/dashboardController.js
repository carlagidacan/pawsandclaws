const Appointment = require('../models/appointment');
const Order = require('../models/order');
const User = require('../models/user');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's appointments count
        const todayAppointmentsCount = await Appointment.countDocuments({
            dateTime: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // Get pending orders count
        const pendingOrdersCount = await Order.countDocuments({
            status: 'pending'
        });

        // Get new clients (users created in last 7 days)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const newClientsCount = await User.countDocuments({
            createdAt: { $gte: lastWeek }
        });

        // Calculate revenue from last 7 days
        const recentOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastWeek },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.json({
            todayAppointments: todayAppointmentsCount,
            pendingOrders: pendingOrdersCount,
            newClients: newClientsCount,
            revenue: recentOrders[0]?.total || 0
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
};
