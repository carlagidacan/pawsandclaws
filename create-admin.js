require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

async function createAdmin() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@pawsandclaws.com' });
        if (existingAdmin) {
            console.log('Admin user already exists with email: admin@pawsandclaws.com');
            process.exit(0);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@pawsandclaws.com',
            password: hashedPassword,
            phone: '555-0123',
            isClient: false,
            isAdmin: true
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@pawsandclaws.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        mongoose.connection.close();
    }
}

createAdmin();