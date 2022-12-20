const mongoose = require('mongoose')
const addressSchema = new mongoose.Schema({

    userID: {
        type: mongoose.Types.ObjectId,
        ref:'User'
    },

    firstname: {
        type: String,
    },
    email: {
        type: String,
    },
    mobileno: {
        type: String,

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

})

module.exports = mongoose.model('Address', addressSchema)