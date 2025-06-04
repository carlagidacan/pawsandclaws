const Pet = require('../models/pet');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/assets/uploads/pets'));
    },
    filename: (req, file, cb) => {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('avatar');

// Handle pet avatar upload
const uploadPetAvatar = async (req, res) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: 'File upload error',
                error: err.message
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only images (jpg, jpeg, png, gif) are allowed.',
                error: err.message
            });
        }

        // File uploaded successfully
        const avatarUrl = '/assets/uploads/pets/' + req.file.filename;
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            url: avatarUrl
        });
    });
};

// Add a new pet
const addPet = async (req, res) => {
    try {
        const ownerId = req.user.id; // Get from auth middleware
        
        // Create new pet with owner
        const petData = {
            ...req.body,
            owner: ownerId
        };

        const pet = new Pet(petData);
        await pet.save();

        res.status(201).json({
            success: true,
            message: 'Pet added successfully',
            pet: pet
        });
    } catch (error) {
        console.error('Error adding pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add pet',
            error: error.message
        });
    }
};

// Get all pets for a user
const getUserPets = async (req, res) => {
    try {
        const ownerId = req.user.id;
        console.log('Fetching pets for user:', ownerId);
        
        const pets = await Pet.find({ owner: ownerId });
        console.log('Found pets:', pets);
        
        res.status(200).json({
            success: true,
            pets: pets
        });
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pets',
            error: error.message
        });
    }
};

module.exports = {
    addPet,
    getUserPets,
    uploadPetAvatar
};
