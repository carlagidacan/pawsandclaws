const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const User = require('../models/user');
const adminAuth = require('../middleware/adminAuth');

// Get recent orders
router.get('/recent', adminAuth, async (req, res) => {
    try {
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'firstName lastName');

        // Transform data to match expected format
        const formattedOrders = recentOrders.map(order => ({
            orderNumber: order.orderNumber,
            customer: `${order.customer.firstName} ${order.customer.lastName}`,
            items: order.items.length.toString(),
            total: order.totalAmount.toFixed(2),
            status: order.status
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
});

module.exports = router;
