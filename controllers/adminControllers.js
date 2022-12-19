const Admin = require('../models/userModel')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const session = require('express-session')
const multer = require('multer');
const path = require('path')
const { find, findOne, findByIdAndDelete } = require('../models/productModel')

let adminSession

const isLoggedIn = (req, res, next) => {
    if (adminSession) {
        console.log(adminSession);
        next();
    } else {
        res.redirect('/admin/login');
    }
}

const isLoggedOut = (req, res, next) => {
    if (adminSession) {
        res.redirect('/')
    } else {
        next();
    }
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/productImages'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});




const upload = multer({ storage: storage })





const adminLogin = (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

const adminDashboard = async (req, res) => {

    try {
        const categoryData = await Category.find()
        const categoryArray = []
        const catorderCount = []
        for (let key of categoryData) {
            categoryArray.push(key.category)
            catorderCount.push('0')
        }
        const completeorder = []
        const orderData = await Order.find()

        for (let key of orderData) {
            const uppend = await key.populate('cartProduct.productID')
            completeorder.push(uppend)
        }

        for (let i = 0; i < completeorder.length; i++) {
            for (let j = 0; j < completeorder[i].cartProduct.length; j++) {
                const cat = completeorder[i].cartProduct[j].productID.productCatagory
                const isExisting = categoryArray.findIndex(category => {
                    return category === cat
                })
                catorderCount[isExisting]++
            }
        }
        console.log(categoryArray);
        console.log(catorderCount);
        res.render('dashboard',{name:categoryArray, count:catorderCount})
    }
    catch (error) {
        console.log(error.message);
    }
}










// const adminIndex = (req, res) => {

//     try {
//         res.redirect('/admin/dashboard')
//     }
//     catch (error) {
//         console.log(error.message);
//     }
// }



const adminAuth = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password
        const adminData = await Admin.findOne({ email: email })
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password)
            if (passwordMatch) {
                if (adminData.isAdmin === 0) {
                    res.render('login', { message: "please verify your mail" })
                }
                else {
                    req.session.adminId = adminData._id
                    adminSession = req.session.adminId
                    res.redirect('/admin/dashboard')
                    console.log('Admin logged in')
                }
            } else {
                res.render('login', { message: "Password is incorrect" })
            }
        } else {
            res.render('login', { message: "Email is incorrect" })
        }

    } catch (error) {
        console.log(error.message);
    }
}



const adminProfile = (req, res) => {
    try {
        res.render('profile')
    }
    catch (error) {
        console.log(error.message);
    }
    //res.render('profile')
}


const usersList = async (req, res) => {
    try {
        const userData = await User.find({ isAdmin: 0 })

        res.render('usersList', { users: userData })
        res.redirect('/admin/login')
    }
    catch (error) {
        console.log(error.message);
    }
}



const adminAddProduct = async (req, res) => {
    try {
        const category = await Category.find()
        res.render('addproduct', { category: category })
    }
    catch (error) {
        console.log(error.message);
    }
    // res.render('addproduct')
}




const adminProducts = async (req, res) => {
    try {
        const productData = await Product.find({ isDeleted: 0 })
        res.render('products', { products: productData })
    }
    catch (error) {
        console.log(error.message);
    }
}



const adminBlockUser = async (req, res) => {
    try {
        const id = req.query.id
        //console.log(id);
        const userData = await User.findById({ _id: id })
        if (userData.isVerified) {
            await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 0 } })
        }
        else {
            await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 1 } })
        }
        // res.render('dashboard',{users:userData})
        res.redirect('/admin/usersList')
    } catch (error) {
        console.log(error.message);
    }
}




const adminAddProductButton = async (req, res) => {
    try {
        const files = req.files;
        if(!files){
            const error = new Error('Please choose file')
            error.httpStatusCode = 400
            return next(error)
        }
        const product = Product({
            productName: req.body.productname,
            productPrice: req.body.productPrice,
            productRate: req.body.productRate,
            productInfo: req.body.productInfo,
            productDiscription: req.body.productDiscription,
            productQuantity: req.body.productQuantity,
            productCatagory: req.body.productCatagory,
            productImage: req.files[0] && req.files[0].filename ? req.files[0].filename:"",
            productImage2: req.files[1] && req.files[1].filename ? req.files[1].filename:"",
            productImage3: req.files[2] && req.files[2].filename ? req.files[2].filename:""
        })
        console.log(product)
        const productData = await product.save();
        if (productData) {
            res.redirect('/admin/products')
            console.log(productData);
        } else {
            res.render('addProduct', { message: "Failed to add" })
        }
    } catch (error) {
        console.log(error.message);
        return res.sendStatus(500);
    }
}


const editProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id: id });
        if (productData) {
            res.render('editProduct', { products: productData })
        } else {
            console.log('Product not found')
        }
    } catch (error) {
        console.log(error.message);
    }
}


const posteditProduct = async (req, res) => {
    try {
        console.log(req.body);
        await Product.findByIdAndUpdate({ _id: req.query.id }, { $set: { productName: req.body.productName, productPrice: req.body.productPrice, productDiscription: req.body.productDiscription, productInfo: req.body.productInfo, productQuantity: req.body.productQuantity, productImage: req.files[0] && req.files[0].filename ? req.files[0].filename:"", productImage: req.files[1] && req.files[1].filename ? req.files[1].filename:"", productImage: req.files[2] && req.files[2].filename ? req.files[2].filename:"" } })
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
    }
}

const productDelete = async (req, res) => {
    try {
        const id = req.query.id
        //console.log(id);
        const productData = await Product.findById({ _id: id })
        if (productData.isDeleted) {
            await Product.findByIdAndUpdate({ _id: id }, { $set: { isDeleted: 0 } })
        }
        else {
            await Product.findByIdAndUpdate({ _id: id }, { $set: { isDeleted: 1 } })
        }
        // res.render('dashboard',{users:userData})
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
    }
}

const category = async (req, res) => {
    try {
        const category = await Category.find()
        res.render('categoryManage', { category: category })
    } catch (error) {
        console.log(error.message);
    }
}


const addCategory = async (req, res, next) => {
    try {
        const cat = req.body.category
        const isExist = await Category.findOne({ category: cat })
        if (isExist == null && cat != '') {
            const categories = Category({
                category: cat,
            })
            await categories.save()
        } else {
            console.log("Category Exists or Its is null");
        }

        res.redirect('/admin/category')

    } catch (error) {
        console.log(error.message);
    }
}

const delCategory = async (req, res, next) => {
    const del = await Category.deleteOne({ _id: req.query.id })
    res.redirect('/admin/category')
}


const coupon = async (req, res) => {
    try {
        const coupon = await Coupon.find()
        res.render('couponManage', { coupons: coupon })
    } catch (error) {
        console.log(error.message);
    }
}


const addcoupon = async (req, res) => {
    try {
        const cop = req.body.couponCode
        const isExist = await Coupon.findOne({ couponCode: cop })
        if (isExist == null && cop != '') {
            const coupons = new Coupon({
                couponCode: req.body.couponCode,
                couponDiscount: req.body.couponDiscount
            })
            await coupons.save()
            res.redirect('/admin/coupons')
        } else {
            console.log("Coupon Exists or Its is null");
            res.redirect('/admin/coupons')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const delCoupon = async (req, res, next) => {
    const del = await Coupon.deleteOne({ _id: req.query.id })
    res.redirect('/admin/coupons')
}

const orderManage = async (req, res, next) => {
    const orderData = await Order.find()
    res.render('orderManage', { order: orderData, products: '' })
}


const orderStatus = async (req, res, next) => {
    const orderData = await Order.findOne({ _id: req.query.id })
    console.log(orderData.status);
    if (orderData.status == 'billed') {
        orderData.status = 'confirmed'
    } else if (orderData.status == 'confirmed') {
        orderData.status = 'delivered'
    }
    const orderstatussave = await orderData.save()
    res.redirect('/admin/orders')
}

const cancelOrder = async (req, res, next) => {
    const del = await Order.deleteMany({ _id: req.query.id })
    res.redirect('/admin/orders')
}


const adminLogout = async (req, res) => {
    try {
        // adminSession = req.session
        // adminSession.userId = false
        adminSession.adminId = ''
        res.redirect('/admin/login')
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    adminDashboard,
    adminAuth,
    adminLogin,
    adminProfile,
    usersList,
    adminAddProduct,
    adminProducts,
    adminBlockUser,
    adminAddProductButton,
    adminLogout,
    editProduct,
    posteditProduct,
    productDelete,
    category,
    addCategory,
    delCategory,
    orderManage,
    orderStatus,
    cancelOrder,
    coupon,
    addcoupon,
    delCoupon,
    upload,
    isLoggedIn,
    isLoggedOut
}