const express = require('express');
const router = express.Router();
const { signup, login, fetchUserData } = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Sign up route
router.post('/signup', signup);

// Login route
router.post('/login', login);

// Protected route to fetch user data
router.get('/user', auth, fetchUserData);

// Admin signup route
router.post('/admin/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new admin user
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            isAdmin: true
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully'
        });

    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin account'
        });
    }
});

// Admin login route
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists and is an admin
        const user = await User.findOne({ email, isAdmin: true });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Create a JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: true
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during admin login'
        });
    }
});

module.exports = router;
