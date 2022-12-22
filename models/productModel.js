const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

    productName: {
        type: String,
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    productRate: {
        type: Number,
        required: true
    },
    productInfo: {
        type: String,
        required: true
    },
    productDiscription: {
        type: String,
        required: true
    },
    productCatagory: {
        type: String,
        required: true
    },
    productQuantity: {
        type: Number,
        required: true
    },
    productImage: {
        type: String,

    },
    productImage2: {
        type: String,

    },
    productImage3: {
        type: String,

    },
    isDeleted: {
        type: Number,
        default: 0
    },
    qty: {
        type: Number,
        default:0
    },
    uploadedAt:{
        type:Date,
        immutable:true,
        default:()=>Date.now()
    },

})


module.exports = mongoose.model('Product', productSchema)