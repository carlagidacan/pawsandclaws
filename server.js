require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const path = require('path');

const app = express();

// Middleware
app.use(cors());  // Allow all origins for development
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes must come before static files
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api', require('./routes/api'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Connect to Database
connectDB();

// Serve static files from the 'public' directory
app.use(express.static('public'));

// API documentation route
app.get('/api', (req, res) => {
    res.json({
        message: 'API endpoints:',
        endpoints: [
            { path: '/api/auth/signup', method: 'POST', description: 'Create new user account' },
            { path: '/api/auth/login', method: 'POST', description: 'Login user' },
            { path: '/api/auth/user', method: 'GET', description: 'Get user data (requires auth)' }
        ]
    });
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGODB_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true
});