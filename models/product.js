const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Dog Food', 'Cat Food', 'Medications', 'Accessories', 'Treats']
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        default: null
    },
    isOnSale: {
        type: Boolean,
        default: false
    },
    salePrice: {
        type: Number,
        min: 0
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    isNew: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;