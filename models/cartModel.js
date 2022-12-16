const mongoose = require('mongoose')
const Product = require('./productModel')
const cartSchema = new mongoose.Schema({

    userID: {
        type: mongoose.Types.ObjectId,
    },


    cartProduct: [{
        productID: {
            type: mongoose.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        qty: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
        }
    }],

    totalPrice: {
        type: Number,
    }
})

module.exports = mongoose.model('Cart', cartSchema, 'Cart')