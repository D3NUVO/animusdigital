const mongoose = require('mongoose')
const Product = require('./productModel')
const userSchema = new mongoose.Schema({

    firstname: {
        type: String,
    },
    email: {
        type: String,
    },
    mobileno: {
        type: String,

    },
    password: {
        type: String,
        require:true
    },
    
    isAdmin: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Number,
        default: 0
    },

    coupons:[{
        couponCode:{
            type:String
        }
    }],

})

module.exports = mongoose.model('User', userSchema)