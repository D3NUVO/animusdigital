
const User = require('../models/userModel')
const path = require('path')
const bcrypt = require('bcrypt')
const fast2sms = require('fast-two-sms')
const session = require('express-session')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const { findOne, findById } = require('../models/productModel')
const { log, count } = require('console')
const { resolve } = require('path')
const { rejects } = require('assert')

let userSession = {
    userId: '',
}


let mobile

let USERID

const sendMessage = function (mobile, res) {
    randomOTP = Math.floor(Math.random() * 10000)
    var options = {
        authorization: 'MSOj0bTnaP8phCARmWqtzkgEV4ZN2Ff9eUxXI7iJQ5HcDBKsL1vYiamnRcMxrsjDJboyFEXl0Sk37pZq',
        message: `Your OTP verification code for https://www.animusdigital.xyz signup is ${randomOTP}`,
        numbers: [mobile]
    }

    fast2sms.sendMessage(options)
        .then((response) => {
            console.log("OTP sent succcessfully")
        }).catch((error) => {
            console.log(error)
        })
    return randomOTP;
}


const isLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        console.log(req.session.userId);
        next();
    } else {
        res.redirect('/signin');
    }
}

const isLoggedOut = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/')
    } else {
        next();
    }
}



const userSignup = (req, res) => {
    try {
        res.render('signup')
    } catch (error) {
        console.log(error.message);
    }
}


const userRegister = async (req, res) => {
    try {

        const bpass = req.body.password
        const cpass = req.body.Cpassword
        const spassword = await bcrypt.hash(cpass, 10)
        const prevemail = await User.findOne({ email: req.body.email })
        console.log(spassword);
        if (prevemail != req.body.email) {
            if (bpass == cpass) {
                const user = User({
                    firstname: req.body.firstname,
                    email: req.body.email,
                    mobileno: req.body.mobileno,
                    password: spassword,
                    isAdmin: 0,
                })
                console.log(user);
                await user.save()
                // res.redirect('/signin')


                USERID = user._id
                mobile = req.body.mobileno
                if (user) {
                    sendMessage(req.body.mobileno)
                    res.render('otp')
                    // res.render('signin', { message: "Your registration was successfull." })
                } else {
                    res.render('signup', { message: "Your registration was Incomplete" })
                }


            } else {
                res.redirect('/signup')
                console.log('pASSWORD DONOT MATCH');
            }
        } else {
            res.render('signup', { message: "User already registered with same email ID" })
        }

    } catch (error) {
        console.log(error.message);
    }
}



const otpValidation = async (req, res) => { // run when clicking the otp validation button
    try {
        userSession = req.session;
        const otp = req.body.otp;
        if (otp == randomOTP) {
            const validatedUser = await User.findById({ _id: USERID })
            validatedUser.isVerified = 1
            const test = await validatedUser.save();
            if (test) {
                console.log("User validated successfully...");
                res.redirect('/signin')
            } else {
                res.render('otp', { message: "Incorrect OTP" })
            }
        } else {
            res.render('otp', { message: "Incorrect OTP" })
        }
    } catch (error) {
        console.log(error.message);
    }

}


const index = async (req, res) => {
    try {
        if (req.session.userId) {
            const productData = await Product.find({ isDeleted: 0 }).sort({
                uploadedAt: -1
            }).limit(8)
            if (req.session.userId) {
                const userCart = await Cart.findOne({ userID: req.session.userId })
                if (userCart) {
                    const count = userCart.cartProduct.length
                    const totalprice = userCart.totalPrice
                    res.render('index', { userSession: req.session.userId, products: productData, count: count, totalprice: totalprice })
                } else {
                    res.render('index', { userSession: req.session.userId, products: productData, count: 0, totalprice: '' })
                }
            }
        } else {
            const productData = await Product.find({ isDeleted: 0 }).sort({
                uploadedAt: -1
            }).limit(8)
            if (req.session.userId) {
                res.render('index', { userSession: req.session.userId, products: productData, count: 0, totalprice: '' })
            } else {
                res.render('index', { userSession: req.session.userId, products: productData })
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


const userLogin = (req, res) => {
    try {
        res.render('signin')
    }
    catch (error) {
        console.log(error.message);
    }
}


const userAuth = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({ email: email })

        if (userData) {

            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.isVerified === 0) {
                    res.render('signin', { message: "please verify your mail" })
                }
                else {
                    req.session.userId = userData._id
                    userSession = req.session
                    res.redirect('/')
                    console.log("user logged in")
                }
            } else {
                res.render('signin', { message: "password is incorrect" })
            }


        } else {
            res.render('signin', { message: "Email is incorrect" })
        }

    } catch (error) {
        console.log(error.message);
    }
}


const userDashBoard = async (req, res) => {
    try {
        const fullorder = await User.findOne({ userID: req.session.userId })
        const userCart = await Cart.findOne({ userID: req.session.userId })
        console.log(fullorder.createdAt);
        //var date = new Date(fullorder.createdAt).toLocaleString(undefined, {timeZone: 'Asia/Kolkata'});
        if (fullorder) {
            if (userCart) {
                const count = userCart.cartProduct.length
                const userOrder = await Order.find({ userID: req.session.userId })
                if (userOrder) {
                    res.render('dashboard', { fullorder: fullorder, order: userOrder, count: count, totalprice: '' })
                } else {
                    res.render('dashboard', { fullorder: fullorder, order: '', count: count, totalprice: '' })
                }
            } else {
                res.render('dashboard', { fullorder: fullorder, order: '', count: 0, totalprice: '' })
            }
        } else {
            res.render('dashboard', { fullorder: fullorder, order: '', fullorder: '', count: 0, totalprice: '' })
        }

    } catch (error) {
        console.log(error.message);
    }
}




const cart = async (req, res) => {
    try {
        if (req.session.userId) {
            let success = false
            userSession = req.session.userId
            const userCart = await Cart.findOne({ userID: req.session.userId })
            const products = await Cart.findOne({ userID: req.session.userId }).populate('cartProduct.productID')
            if (userCart) {
                const count = userCart.cartProduct.length
                const totalprice = userCart.totalPrice
                if (userCart) {
                    products.totalPrice = 0
                    const totalPrice = products.cartProduct.reduce((acc, curr) => {
                        return acc + (curr.productID.productPrice * curr.qty)
                    }, 0)
                    products.totalPrice = totalPrice
                    await products.save()
                    console.log('entered in cart');
                    // const productData = await Cart.findOne({ userID: userSession.userId }).populate('cartProduct.productID')
                    const completeCart = await userCart.populate('cartProduct.productID')
                    const cartTotal = await Cart.findOne({ userID: req.session.userId })

                    if (completeCart) {
                        res.render('cart', { userid: req.session.userId, cartProducts: completeCart.cartProduct, totalPrice: cartTotal.totalPrice, count: count, totalprice: totalprice })
                    } else {
                        res.render('cart', { userid: req.session.userId, cartProducts: completeCart.cartProduct, totalPrice: cartTotal.totalPrice, count: count, totalprice: totalprice })
                    }

                } else {
                    res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: '', count: 0, totalprice: '' })
                }
            } else {// cartProduct error else
                res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: '', count: 0, totalprice: '' })
            }



        } else { //real item
            let success = false
            userSession = req.session.userId
            if (userSession) {
                const userCart = await Cart.findOne({ userID: req.session.userId })
                const products = await Cart.findOne({ userID: userSession.userId }).populate('cartProduct.productID')
                if (userCart) {
                    products.totalPrice = 0
                    const totalPrice = products.cartProduct.reduce((acc, curr) => {
                        return acc + (curr.productID.productPrice * curr.qty)
                    }, 0)
                    products.totalPrice = totalPrice
                    await products.save()
                    console.log('entered in cart');
                    // const productData = await Cart.findOne({ userID: userSession.userId }).populate('cartProduct.productID')
                    const completeCart = await userCart.populate('cartProduct.productID')
                    const cartTotal = await Cart.findOne({ userID: req.session.userId })

                    if (cartTotal) {
                        if (completeCart) {
                            res.render('cart', { userid: req.session.userId, cartProducts: completeCart.cartProduct, totalPrice: cartTotal.totalPrice, count: 0, totalprice: '' })
                        } else {
                            res.render('cart', { userid: req.session.userId, cartProducts: completeCart.cartProduct, totalPrice: cartTotal.totalPrice, count: 0, totalprice: '' })
                        }
                    }

                } else {
                    res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: '', count: 0, totalprice: '' })
                }
            } else {
                res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: '', count: 0, totalprice: '' })
            }

        }
    }
    catch (error) {
        console.log(error.message);
    }
}




const deleteCart = async (req, res, next) => {
    try {
        userSession = req.session
        // const cartItem = await Cart.cartProduct.splice(_id:cartItemId)
        await Cart.findOneAndUpdate({ userID: userSession.userId }, {
            $pull: {
                cartProduct:
                    { _id: req.query.id }
            }
        })
        res.redirect('/cart')
    } catch (error) {
        console.log(error.message);
    }
}

const delwishlist = async (req, res, next) => {
    const del = await Wishlist.findOneAndUpdate({ userID: userSession.userId }, {
        $pull: {
            wishProduct:
                { _id: req.query.id }
        }
    })

    res.redirect('/wish-list')
}


const updateQuantity = async (req, res, next) => {
    try {
        userSession = req.session
        const arrayid = req.query.id;
        console.log(req.body.qnty);
        console.log(arrayid);
        const productData = await Cart.findOne({ userID: userSession.userId }).populate('cartProduct.productID')
        console.log(productData);
        const productIndex = productData.cartProduct.findIndex(objInItems => objInItems._id == arrayid)
        console.log('product found at: ', productIndex)
        productData.cartProduct[productIndex].qty = req.body.qnty
        await productData.save()

        res.redirect('/cart')
    } catch (error) {
        console.log(error.message);
    }
}


const addCart = async (req, res) => {
    try {
        userSession = req.session
        const productId = req.query.id
        console.log(productId);
        console.log(userSession.userId);
        const productData = await Product.findOne({ _id: productId })
        const cartData = await Cart.findOne({ userID: userSession.userId })

        if (cartData != null) {
            console.log('cartData');
            const isExisting = await Cart.findOne({ userID: req.session.userId, 'cartProduct.productID': productId })
            console.log(isExisting);

            if (isExisting != null) {
                console.log('isExisting');
                await Cart.updateOne({ userID: userSession.userId, 'cartProduct.productID': productId },
                    { $inc: { 'cartProduct.$.qty': 1 } })

                res.redirect('/product-store')
            } else {
                console.log('else');
                await Cart.updateOne({ userID: userSession.userId },
                    { $push: { cartProduct: { "productID": productId, "qty": 1, price: productData.productPrice } } })

                res.redirect('/product-store')
            }

        } else {
            const cartItems = new Cart({
                userID: req.session.userId,
                cartProduct: [{
                    productID: productId,
                    qty: 1
                }],
                totalPrice: 0
            })

            await cartItems.save();
            res.redirect('/product-store')
        }

    } catch (error) {
        console.log(error.message);
    }
}




const wishaddCart = async (req, res) => {
    try {
        console.log('Entered in Wishaddcart');
        userSession = req.session
        const productId = req.query.id
        console.log(productId);
        console.log(userSession.userId);
        const productData = await Product.findOne({ _id: productId })
        const cartData = await Cart.findOne({ userID: userSession.userId })

        if (cartData != null) {
            console.log('cartData');
            const isExisting = await Cart.findOne({ userID: userSession.userId, 'cartProduct.productID': productId })

            if (isExisting != null) {
                console.log('isExisting');
                await Cart.updateOne({ userID: userSession.userId, 'cartProduct.productID': productId },
                    { $inc: { 'cartProduct.$.qty': 1 } })
                success = true
                res.redirect('/wish-list')
            } else {
                console.log('else');
                await Cart.updateOne({ userID: userSession.userId },
                    { $push: { cartProduct: { "productID": productId, "qty": 1, price: productData.productPrice } } })
                success = true
                res.redirect('/wish-list')
            }

        } else {
            const cartItems = new Cart({
                userID: req.session.userId,
                cartProduct: [{
                    productID: productId,
                    qty: 1
                }],
                totalPrice: 0
            })

            await cartItems.save();
            success = true
            res.redirect('/wish-list')
        }

        if (success) {
            const del = await Wishlist.findOneAndUpdate({ userID: userSession.userId }, {
                $pull: {
                    wishProduct:
                        { _id: req.body.wishid }
                }
            })
        } else {
            res.redirect('/wish-list')
        }



    } catch (error) {
        console.log(error.message);
    }
}


const onClickProduct = async (req, res) => {
    try {
        if (req.session.userId) {
            const userCart = await Cart.findOne({ userID: req.session.userId })
            if (userCart) {
                const userCart = await Cart.findOne({ userID: req.session.userId })
                const count = userCart.cartProduct.length
                const id = req.query.id
                const productData = await Product.findById({ _id: id })
                if (productData) {
                    res.render('product-details', { products: productData, count: count, totalprice: '' })
                }
                else {
                    res.redirect('/')
                }
            } else {
                const id = req.query.id
                const productData = await Product.findById({ _id: id })
                if (productData) {
                    res.render('product-details', { products: productData, count: 0, totalprice: '' })
                }
                else {
                    res.redirect('/')
                }
            }
        } else {
            const id = req.query.id
            const productData = await Product.findById({ _id: id })
            if (productData) {
                res.render('product-details', { products: productData, count: 0, totalprice: '' })
            }
            else {
                res.redirect('/')
            }
        }


    } catch (error) {
        console.log(error.message);
    }

}

const productStore = async (req, res) => {

    try {
        const categories = await Category.find({})
        let search = '';
        if (req.query.search) {
            search = req.query.search;
            console.log(search);
        }

        productSearch = await Product.find({
            isDeleted: 0,
            $or: [
                {
                    productName
                        : { $regex: '.*' + search + '.*', $options: 'i' }
                },
                {
                    productInfo
                        : { $regex: '.*' + search + '.*', $options: 'i' }
                }
            ]
        });

        if (req.session.userId) {
            const userCart = await Cart.findOne({ userID: req.session.userId })
            if (userCart) {
                const userCart = await Cart.findOne({ userID: req.session.userId })
                const count = userCart.cartProduct.length
                const totalprice = userCart.totalPrice
                res.render('product-store', {
                    products: productSearch, count: count, totalprice: totalprice,
                    userid: req.session.userId, Category: categories,
                    // sub: sub,
                    // categories: productCategories,
                    // product: productSearch,
                    // totalPages: Math.ceil(count / limit),
                    // currentPage: page
                })
            } else {
                res.render('product-store', {
                    products: productSearch, count: 0, totalprice: '',
                    userid: req.session.userId, Category: categories,
                    // sub: sub,
                    // categories: productCategories,
                    // product: productSearch,
                    // totalPages: Math.ceil(count / limit),
                    // currentPage: page
                })
            }
        } else {
            res.render('product-store', {
                products: productSearch, count: 0, totalprice: '',
                userid: req.session.userId, Category: categories,
                // sub: sub,
                // categories: productCategories,
                // product: productSearch,
                // totalPages: Math.ceil(count / limit),
                // currentPage: page
            })
        }
    } catch (error) {
        console.log(error.message);
    }

}


const selectcatagory = async (req, res) => {
    const productData = await Product.find({ productCatagory: req.body.cat })
    const categories = await Category.find({})
    res.render('product-store', { products: productData, Category: categories, userid: req.session.userId })
}



const checkout = async (req, res, next) => {
    try {
        req.session.totalPrice = ''
        req.session.coupondisc = ''
        req.session.couponcode = ''
        const fulluser = await User.findOne({ userID: req.session.userId })
        const userCart = await Cart.findOne({ userID: req.session.userId })
        const count = userCart.cartProduct.length
        const totalprice = userCart.totalPrice
        const fullcart = await Cart.findOne({ userID: req.session.userId })
        // const totalPrice = fullcart.totalPrice
        req.session.totalPrice = fullcart.totalPrice
        res.render('checkout', { message: '', fullorder: fulluser, totalPrice: req.session.totalPrice, coupondisc: req.session.coupondisc, coupon: req.session.couponcode, count: count, totalprice: totalprice })

    } catch (error) {
        if (error) {
            res.redirect('/')
        }
        console.log(error.messsage);
    }
}

const placeOrder = async (req, res, next) => {
    try {
        console.log(req.session.userId);
        const fullcart = await Cart.findOne({ userID: req.session.userId })
        const order = new Order({
            userID: req.session.userId,
            orderName: req.body.orderName,
            ordercompanyName: req.body.ordercompanyName,
            orderCountry: req.body.orderCountry,
            orderStreetAddress: req.body.orderStreetAddress,
            orderState: req.body.orderState,
            orderCity: req.body.orderCity,
            orderZip: req.body.orderZip,
            orderPhone: req.body.orderPhone,
            orderEmail: req.body.orderEmail,
            orderNote: req.body.orderNote,
            cartProduct: fullcart.cartProduct,
            paymentType: req.body.payment,
            couponCode: req.session.couponcode,
            totalPrice: req.session.totalPrice

        })
            order.save();
            res.redirect('/to-payment')

    } catch (error) {
        console.log(error);
    }
}


const toPayment = async (req, res, next) => { //to get order id in payment COD
    try {
        if (req.session.userId) {
            const userCart = await Cart.findOne({ userID: req.session.userId })
            const count = userCart.cartProduct.length
            const totalprice = userCart.totalPrice
            const fullorder = await Order.findOne({ userID: req.session.userId }).sort({
                createdAt: -1
            }).limit(1)


            console.log(fullorder);

            if (fullorder) {
                res.render('toPayment', { order: fullorder, count: count, totalprice: totalprice })
            } else {
                res.redirect('/check-out')
            }
        } else {
            const fullorder = await Order.findOne({ userID: req.session.userId }).sort({
                createdAt: -1
            }).limit(1)

            if (fullorder) {
                res.render('toPayment', { order: fullorder, count: '', totalprice: '' })
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


const payment = async (req, res, next) => {
    try {
        const fullorder = await Order.findOne({ userID: req.session.userId }).sort({
            createdAt: -1
        }).limit(1)  //get the lastest one how

        console.log(fullorder);
        const orderid = fullorder._id // to get id of latest order

        if (fullorder.paymentType == "COD") {
            const del = await Cart.deleteMany({ userID: req.session.userId })
            const order = await Order.findOneAndUpdate({ _id: orderid }, { $set: { status: 'billed' } })
            const totalprice = ''
            const count = 0
            res.render('orderSuccess', { count: count, totalprice: totalprice })

        } else {
            res.render('paypal', { cart: '', order: fullorder, count: '', totalprice: '' })
        }

        // else if (fullorder.paymentType == "razorPay") { //need to update
        //     const del = await Cart.deleteMany({ userID: req.session.userId })
        //     const order = await Order.findOne({ _id: orderid })
        //     const totalprice = ''
        //     const count = 0

        //     Order.status = 'billed'
        //     await order.save()

        //     res.render('orderSuccess', { count: count, totalprice: totalprice })


        // }

    } catch (error) {
        console.log(error.message);
    }
}


const orderSuccess = async (req, res, next) => { //for paypal and razor pay
    try {
        const del = await Cart.deleteMany({ userID: req.session.userId })
        const totalprice = ''
        const count = 0
        const order = await Order.findOneAndUpdate({ _id: req.query.id }, { $set: { status: 'billed' } })

        res.render('orderSuccess', { count: count, totalprice: totalprice })

    } catch (error) {
        console.log(error.message);
    }
}


const orderDetails = async (req, res) => {
    const orderid = req.query.id
    console.log('Query ID : ', orderid);
    const fullorder = await Order.findById({ _id: orderid }).populate('cartProduct.productID userID')
    const userCart = await Cart.findOne({ userID: req.session.userId })
    if (userCart) {
        const count = userCart.cartProduct.length
        const totalprice = userCart.totalPrice
        res.render('orderDetails', { order: fullorder.cartProduct, Tprice: fullorder, count: count, totalprice: totalprice });
    } else {
        res.render('orderDetails', { order: fullorder.cartProduct, Tprice: fullorder, count: '', totalprice: '' });
    }
}


const wishlist = async (req, res) => {
    try {
        if (req.session.userId) { // can be used without checking session coz the wishlist is working only when  logged in
            const userCart = await Cart.findOne({ userID: req.session.userId })
            if (userCart) {
                const count = userCart.cartProduct.length
                const totalprice = userCart.totalPrice
                userSession = req.session
                const cartData = await Cart.find()
                const userwish = await Wishlist.findOne({ userID: req.session.userId })
                const products = await Wishlist.findOne({ userID: userSession.userId }).populate('wishProduct.productID')

                console.log(userwish);
                if (userwish) {
                    console.log('entered in wishlist');
                    // const productData = await Cart.findOne({ userID: userSession.userId }).populate('cartProduct.productID')
                    const completeWish = await userwish.populate('wishProduct.productID')

                    if (completeWish) {
                        res.render('wishlist', { userid: userSession.userId, wishProducts: completeWish.wishProduct, products: cartData, count: count, totalprice: totalprice })
                    } else {
                        res.render('wishlist', { userid: userSession.userId, wishProducts: completeWish.wishProduct, count: count, totalprice: totalprice })
                    }

                } else {
                    res.render('wishlist', { userid: userSession.userId, wishProducts: '', totalPrice: '', count: count, totalprice: totalprice })
                }
            } else {
                userSession = req.session
                const cartData = await Cart.find()
                const userwish = await Wishlist.findOne({ userID: req.session.userId })
                const products = await Wishlist.findOne({ userID: req.session.userId }).populate('wishProduct.productID')

                console.log(userwish);
                if (userwish) {
                    console.log('entered in wishlist');
                    // const productData = await Cart.findOne({ userID: userSession.userId }).populate('cartProduct.productID')
                    const completeWish = await userwish.populate('wishProduct.productID')

                    if (completeWish) {
                        res.render('wishlist', { userid: req.session.userId, wishProducts: completeWish.wishProduct, products: cartData, count: 0, totalprice: '' })
                    } else {
                        res.render('wishlist', { userid: req.session.userId, wishProducts: completeWish.wishProduct, count: 0, totalprice: '' })
                    }

                } else {
                    res.render('wishlist', { userid: req.session.userId, wishProducts: '', totalPrice: '', count: 0, totalprice: '' })
                }
            }


        } else {
            userSession = req.session
            if (req.session.userId) {
                const cartData = await Cart.find()
                const userwish = await Wishlist.findOne({ userID: req.session.userId })
                const products = await Wishlist.findOne({ userID: req.session.userId }).populate('wishProduct.productID')

                console.log(userwish);
                if (userwish) {
                    console.log('entered in wishlist');
                    // const productData = await Cart.findOne({ userID: userSession.userId }).populate('cartProduct.productID')
                    const completeWish = await userwish.populate('wishProduct.productID')

                    if (completeWish) {
                        res.render('wishlist', { userid: req.session.userId, wishProducts: completeWish.wishProduct, products: cartData, count: 0, totalprice: '' })
                    } else {
                        res.render('wishlist', { userid: req.session.userId, wishProducts: completeWish.wishProduct, count: 0, totalprice: '' })
                    }

                } else {
                    res.render('wishlist', { userid: req.session.userId, wishProducts: '', totalPrice: '', count: 0, totalprice: '' })
                }
            } else {
                res.render('wishlist', { userid: req.session.userId, wishProducts: '', totalPrice: '', count: 0, totalprice: '' })
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}





const addwishlist = async (req, res) => {
    try {
        userSession = req.session
        const productId = req.query.id
        console.log(productId);
        console.log(userSession.userId);
        const productData = await Product.findOne({ _id: productId })
        const wishData = await Wishlist.findOne({ userID: userSession.userId })

        if (wishData != null) {
            const isExisting = await Wishlist.findOne({ userID: req.session.userId, 'wishProduct.productID': productId })
            console.log('is existing :', isExisting);

            if (isExisting != null) {
                console.log('Item Already exists');

                res.redirect('/product-store')
            } else {
                console.log('else');
                await Wishlist.updateOne({ userID: userSession.userId },
                    { $push: { wishProduct: { "productID": productId, price: productData.productPrice } } })

                res.redirect('/product-store')
            }

        } else {
            console.log("1");
            const wishItems = new Wishlist({
                userID: req.session.userId,
                wishProduct: [{
                    productID: productId,
                }]
            })
            await wishItems.save();
            console.log(wishItems);
            res.redirect('/product-store')
        }
    } catch (error) {
        console.log(error.message);
    }
}


const applyCoupon = async (req, res, next) => {
    try {

        const couponCode = req.body.couponcode
        req.session.couponcode = couponCode

        const fulluser = await User.findOne({ userID: req.session.userId })
        const totalcart = await Cart.findOne({ userID: req.session.userId })
        const count = totalcart.cartProduct.length
        const coupon = await Coupon.findOne({ couponCode: couponCode })
        req.session.coupondisc = coupon.couponDiscount
        couponDiscount = coupon.couponDiscount
        if (coupon) {
            if (totalcart) {
                console.log(totalcart);
                const totalprice = totalcart.totalPrice
                console.log('Total price is here :', totalprice);
                const newtotalprice = totalprice - totalprice * (couponDiscount / 100)
                req.session.totalPrice = newtotalprice
                console.log(req.session);
                res.render('checkout', { message: '', fullorder: fulluser, coupondisc: req.session.coupondisc, totalPrice: req.session.totalPrice, coupon: req.session.couponcode, count: count, totalprice: '' })
            } else {
                res.redirect('/check-out')
            }
        } else {
            res.redirect('/check-out')
            console.log('There no coupon like that');
        }
    } catch (error) {
        if (error) {
            res.redirect('/')
        }
        console.log(error.message);
    }
}

const editaddress = async (req, res, next) => {
    const fulluser = await User.findOne({ userID: req.session.userId })

    fulluser.firstname = req.body.firstname,
        fulluser.email = req.body.email,
        fulluser.mobileno = req.body.mobileno,
        fulluser.CompanyName = req.body.CompanyName,
        fulluser.Country = req.body.Country,
        fulluser.StreetAddress = req.body.StreetAddress,
        fulluser.Apartment = req.body.Apartment,
        fulluser.City = req.body.City,
        fulluser.State = req.body.State,
        fulluser.postcode = req.body.postcode,
        fulluser.Country = req.body.Country

    console.log(fulluser);

    await fulluser.save()

    res.redirect('/dashboard')
}


const userLogout = async (req, res) => {
    try {
        req.session.userId = null
        req.session.totalPrice = null
        req.session.couponcode = null
        req.session.coupondisc = null
        userSession = ''
        // req.session.userId = ''
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

const ottp = async (req, res) => {
    res.render('otp')
}


module.exports = {
    userSignup,
    userRegister,
    index,
    otpValidation,
    userLogin,
    userAuth,
    userDashBoard,
    cart,
    wishaddCart,
    onClickProduct,
    productStore,
    selectcatagory,
    deleteCart,
    delwishlist,
    addCart,
    updateQuantity,
    checkout,
    placeOrder,
    orderDetails,
    toPayment,
    payment,
    orderSuccess,
    wishlist,
    addwishlist,
    applyCoupon,
    editaddress,
    userLogout,
    isLoggedIn,
    isLoggedOut,
    ottp,
    sendMessage
}