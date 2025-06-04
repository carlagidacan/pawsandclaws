const express = require('express');
const router = express.Router();
const { addPet, getUserPets, uploadPetAvatar } = require('../controllers/petController');
const auth = require('../middleware/auth');

// Add a new pet (protected route)
router.post('/add', auth, addPet);

// Get all pets for a user (protected route)
router.get('/user-pets', auth, getUserPets);

// Upload pet avatar (protected route)
router.post('/upload-avatar', auth, uploadPetAvatar);

module.exports = router;
