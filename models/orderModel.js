const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({

    userID: {
        type: mongoose.Types.ObjectId,
        ref:'User'
    },

    orderName: {
        type: String,
       
    },

    orderCountry: {
        type: String,
      
    },
    appartment: {
        type: String,
    },
    orderStreetAddress: {
        type: String,
        
    },
    orderCity: {
        type: String,
       
    },
    orderState: {
        type: String,
        
    },
    orderZip: {
        type: String,
      
    },
    orderPhone: {
        type: Number,
    
    },
    orderEmail: {
        type: String,
     
    },
    orderNote: {
        type: String,
    },

    status: {
        type: String,
        default: 'pending',
       
    },

    paymentType: {
        type:String,
      
    },
    createdAt:{
        type:Date,
        immutable:true,
        default:()=>Date.now()
    },

    cartProduct: [{
        productID: {
            type: mongoose.Types.ObjectId,
            ref:'Product'
        },
        qty: {
            type: Number,

        },
        price: {
            type: Number,

        }
    }],

    couponCode: {
        type:String,
        default: 'None'
        
    },

    totalPrice: {
        type: Number,
        default:0
    },

})


module.exports = mongoose.model('Order', orderSchema, 'Orders')