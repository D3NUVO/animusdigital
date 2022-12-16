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
    CompanyName: {
        type: String,
        default : ''
    },
    Country: {
        type: String,
        default: ''
    },
    StreetAddress: {
        type: String,
        default: ''
    },
    Apartment: {
        type: String,
        default: ''
    },
    City: {
        type: String,
        default: ''
    },
    State: {
        type: String,
        default: ''
    },
    postcode: {
        type: String,
        default: ''
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