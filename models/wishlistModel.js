const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({

    userID: {
        type: mongoose.Types.ObjectId,
    },

    wishProduct: [{
        productID: {
            type: mongoose.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        
        price: {
            type: Number,
        }
    }],

})


module.exports = mongoose.model('Wishlist', wishlistSchema, 'wishlist')