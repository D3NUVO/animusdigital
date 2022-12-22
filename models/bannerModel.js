const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({

    bannerImage: {
        type: String,
        required: true
    },

    bannerLink: {
        type: String,
        required: true
    },

    uploadedAt:{
        type:Date,
        immutable:true,
        default:()=>Date.now()
    },

})


module.exports = mongoose.model('Banner', bannerSchema)