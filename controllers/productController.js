const Product = require('../models/product');

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const { category, sort, search } = req.query;
        let query = {};
        
        // Apply category filter
        if (category && category !== 'All') {
            query.category = category;
        }
        
        // Apply search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Build sort options
        let sortOptions = {};
        switch(sort) {
            case 'Price: Low to High':
                sortOptions.price = 1;
                break;
            case 'Price: High to Low':
                sortOptions.price = -1;
                break;
            case 'Newest':
                sortOptions.createdAt = -1;
                break;
            default:
                sortOptions = { isBestSeller: -1, createdAt: -1 };
        }

        const products = await Product.find(query).sort(sortOptions);
        
        res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};

module.exports = {
    getAllProducts
};