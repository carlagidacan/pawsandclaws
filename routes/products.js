const express = require('express');
const router = express.Router();
const { getAllProducts } = require('../controllers/productController');
const auth = require('../middleware/auth');

router.get('/', auth, getAllProducts);

module.exports = router;