const express = require('express')
const userRoute = express()

//userRoute.use(session({ secret: config.sessionSecret }))


const userController = require('../controllers/userControllers')

userRoute.get('/signup',userController.isLoggedOut, userController.userSignup)

userRoute.post('/register', userController.isLoggedOut, userController.userRegister)

userRoute.post('/otpsend',userController.isLoggedOut, userController.otpValidation)

userRoute.post('/otpssend',userController.isLoggedOut, userController.sendMessage) //resend otp

userRoute.get('/', userController.index)

userRoute.get('/signin',userController.isLoggedOut, userController.userLogin)

userRoute.post('/login', userController.userAuth)

userRoute.get('/dashboard',userController.isLoggedIn, userController.userDashBoard)

userRoute.get('/cart', userController.cart)

userRoute.post('/add-cart',userController.isLoggedIn, userController.addCart)

userRoute.post('/wish-add-cart',userController.isLoggedIn, userController.wishaddCart)

userRoute.get('/delete-cart',userController.isLoggedIn, userController.deleteCart)

userRoute.post('/delwishlist',userController.isLoggedIn, userController.delwishlist)

userRoute.post('/update-qty',userController.isLoggedIn, userController.updateQuantity)

userRoute.get('/product-details', userController.onClickProduct)

userRoute.get('/product-store', userController.productStore)

userRoute.post('/selectcatagory', userController.selectcatagory)

userRoute.get('/check-out',userController.isLoggedIn, userController.checkout) //checkout page with address

userRoute.post('/place-order',userController.isLoggedIn, userController.placeOrder)//to mongodb

userRoute.get('/to-payment',userController.isLoggedIn, userController.toPayment)

userRoute.post('/payment', userController.isLoggedIn, userController.payment)

userRoute.get('/order-success', userController.isLoggedIn, userController.orderSuccess)

userRoute.post('/order-details', userController.orderDetails)

userRoute.get('/wish-list', userController.wishlist)

userRoute.get('/add-wishlist', userController.isLoggedIn,userController.addwishlist)

userRoute.post('/apply-coupon',userController.isLoggedIn, userController.applyCoupon)

userRoute.post('/editaddress',userController.isLoggedIn, userController.editaddress)

userRoute.get('/logout', userController.userLogout)

// userRoute.get('/otp', userController.ottp)


module.exports = userRoute


