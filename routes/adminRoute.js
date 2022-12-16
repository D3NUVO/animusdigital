const express = require('express')
const adminRoute = express()


//adminRoute.use(session({ secret: config.sessionSecret }))

const adminController = require('../controllers/adminControllers')

adminRoute.get('/', adminController.adminAuth)

adminRoute.post('/login', adminController.adminAuth)

adminRoute.get('/dashboard', adminController.isLoggedIn, adminController.adminDashboard)

adminRoute.get('/login', adminController.adminLogin)

adminRoute.get('/profile', adminController.isLoggedIn, adminController.adminProfile)

adminRoute.get('/usersList', adminController.isLoggedIn, adminController.usersList)

adminRoute.get('/addproduct', adminController.isLoggedIn, adminController.adminAddProduct)

adminRoute.get('/products', adminController.isLoggedIn, adminController.adminProducts)


adminRoute.get('/block-user', adminController.isLoggedIn, adminController.adminBlockUser)

adminRoute.post('/add-product', adminController.isLoggedIn,adminController.upload,adminController.adminAddProductButton)

adminRoute.get('/edit-product', adminController.isLoggedIn, adminController.editProduct)

adminRoute.post('/posteditproduct', adminController.isLoggedIn, adminController.upload,adminController.posteditProduct)

adminRoute.get('/delete-product', adminController.isLoggedIn, adminController.productDelete)

adminRoute.get('/category', adminController.category)

adminRoute.get('/orders', adminController.orderManage)

adminRoute.get('/orders', adminController.orderManage)

adminRoute.post('/order-status', adminController.orderStatus)

adminRoute.post('/cancel-order', adminController.cancelOrder)

adminRoute.post('/add-category', adminController.addCategory)

adminRoute.post('/delete-category', adminController.delCategory)

adminRoute.get('/coupons', adminController.coupon)

adminRoute.post('/add-coupon', adminController.addcoupon)

adminRoute.post('/delete-coupon', adminController.delCoupon)

adminRoute.get('/logout', adminController.isLoggedIn, adminController.adminLogout)


module.exports = adminRoute