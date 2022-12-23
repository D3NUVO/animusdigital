
const User = require('../models/userModel')
const path = require('path')
const bcrypt = require('bcrypt')
const fast2sms = require('fast-two-sms')
const session = require('express-session')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Banner = require('../models/bannerModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const Address = require('../models/addressModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const { findOne, findById, findByIdAndDelete } = require('../models/productModel')
const { log, count } = require('console')
const { resolve } = require('path')
const { rejects } = require('assert')
const address = require('../models/addressModel')

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
        const banner = await Banner.find({})

        if (req.session.userId) {
            const productData = await Product.find({ isDeleted: 0 }).sort({
                uploadedAt: -1
            }).limit(8)
            if (req.session.userId) {
                const userCart = await Cart.findOne({ userID: req.session.userId })
                if (userCart) {
                    const count = userCart.cartProduct.length
                    const totalprice = userCart.totalPrice
                    res.render('index', {banner:banner, userSession: req.session.userId, products: productData, count: count, totalprice: totalprice })
                } else {
                    res.render('index', {banner:banner, userSession: req.session.userId, products: productData, count: 0, totalprice: '' })
                }
            }
        } else {
            const productData = await Product.find({ isDeleted: 0 }).sort({
                uploadedAt: -1
            }).limit(8)
            if (req.session.userId) {
                res.render('index', {banner:banner, userSession: req.session.userId, products: productData, count: 0, totalprice: '' })
            } else {
                res.render('index', {banner:banner, userSession: req.session.userId, products: productData })
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
        const fulluser = await User.findOne({ userID: req.session.userId })
        const userCart = await Cart.findOne({ userID: req.session.userId })
        const userOrder = await Order.find({ userID: req.session.userId }).sort({createdAt:-1})
        const fulladdress = await Address.find({ userID: req.session.userId })

        //var date = new Date(fullorder.createdAt).toLocaleString(undefined, {timeZone: 'Asia/Kolkata'});
        if (fulluser) {
            if (userCart) {
                const count = userCart.cartProduct.length
                if (userOrder) {
                    res.render('dashboard', { fulladdress:fulladdress, fulluser: fulluser, order: userOrder, count: count, totalprice: '' })
                } else {
                    res.render('dashboard', { fulladdress:fulladdress, fulluser: fulluser, order: userOrder, count: count, totalprice: '' })
                }
            } else {
                res.render('dashboard', { fulladdress:fulladdress, fulluser: fulluser, order: userOrder, count: 0, totalprice: '' })
            }
        } else {
            res.render('dashboard', { fulladdress:fulladdress, fulluser: fulluser, order: '', count: 0, totalprice: '' })
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
                    res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: 0, count: 0, totalprice: '' })
                }
            } else {// cartProduct error else
                res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: 0, count: 0, totalprice: '' })
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
                    res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: 0, count: 0, totalprice: '' })
                }
            } else {
                res.render('cart', { userid: req.session.userId, cartProducts: '', totalPrice: 0, count: 0, totalprice: '' })
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

            if (isExisting != null) {
                console.log('isExisting');
                await Cart.updateOne({ userID: userSession.userId, 'cartProduct.productID': productId },
                    { $inc: { 'cartProduct.$.qty': 1 } })

                    res.json({status:true})
            } else {
                console.log('else');
                await Cart.updateOne({ userID: userSession.userId },
                    { $push: { cartProduct: { "productID": productId, "qty": 1, price: productData.productPrice } } })

                //res.redirect('/product-store')
                res.json({status:true})
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
            res.json({status:true})
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

    if (req.body.cat == 'ALL') {
        const productData = await Product.find({isDeleted: 0})
        const categories = await Category.find({})
        if (req.session.userId) {
            const userCart = await Cart.findOne({ userID: req.session.userId })
            if (userCart) {
                const userCart = await Cart.findOne({ userID: req.session.userId })
                const count = userCart.cartProduct.length
                res.render('product-store', { products: productData, Category: categories, userid: req.session.userId, count: count, totalprice: '' })
            } else {
                res.render('product-store', { products: productData, Category: categories, userid: req.session.userId, count: 0, totalprice: '' })
            }
        } else {
            res.render('product-store', { products: productData, Category: categories, userid: req.session.userId, count: 0, totalprice: '' })
        }
    } else {
        const productDat = await Product.find({ productCatagory: req.body.cat })
        const categories = await Category.find({})
        if (req.session.userId) {
            const userCart = await Cart.findOne({ userID: req.session.userId })
            if (userCart) {
                const userCart = await Cart.findOne({ userID: req.session.userId })
                const count = userCart.cartProduct.length
                res.render('product-store', { products: productDat, Category: categories, userid: req.session.userId, count: count, totalprice: '' })
            } else {
                res.render('product-store', { products: productDat, Category: categories, userid: req.session.userId, count: 0, totalprice: '' })
            }
        } else {
            res.render('product-store', { products: productDat, Category: categories, userid: req.session.userId, count: 0, totalprice: '' })
        }

    }
}



const checkout = async (req, res, next) => {
    try {
        req.session.totalPrice = ''
        req.session.coupondisc = ''
        req.session.couponcode = ''
        const seladdress = await Address.find({ _id: req.query._id })
        const fulladdress = await Address.find({ userID: req.session.userId })
        const fulluser = await User.findOne({ userID: req.session.userId })
        const userCart = await Cart.findOne({ userID: req.session.userId })
        const count = userCart.cartProduct.length
        const totalprice = userCart.totalPrice
        const fullcart = await Cart.findOne({ userID: req.session.userId })
        // const totalPrice = fullcart.totalPrice
        const mathprice = fullcart.totalPrice/85
        req.session.totalPrice = Math.ceil(mathprice)
        res.render('checkout', { message: '',seladdress:seladdress,fulladdress:fulladdress, subtotal: totalprice, fullorder: fulluser, totalPrice: req.session.totalPrice, coupondisc: req.session.coupondisc, coupon: req.session.couponcode, count: count, totalprice: totalprice })

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
        await order.save();


        req.session.currentOrder = order._id

        const orders = await Order.findById({_id:req.session.currentOrder})
    const productDetails = await Product.find()
        for(let i=0;i<productDetails.length;i++){
            for(let j=0;j<order.cartProduct.length;j++){
             if(productDetails[i]._id.equals(order.cartProduct[j].productID)){
                 productDetails[i].qty+=order.cartProduct[j].qty;
             }    
            }productDetails[i].save()
         }



        if (req.body.payment == 'payPal') {
            const fullorder = await Order.findOne({ userID: req.session.userId }).sort({
                createdAt: -1
            }).limit(1)
            const orderid = fullorder._id
            await Order.findOneAndUpdate({ _id: orderid }, { $set: { status: 'billed' } })
            res.render('paypal', { cart: '', totalPrice: req.session.totalPrice, order: fullcart, count: '', totalprice: '' })
        } else if (req.body.payment == 'COD') {
            const userCart = await Cart.findOne({ userID: req.session.userId })
            const count = userCart.cartProduct.length
            const del = await Cart.deleteMany({ userID: req.session.userId })
            const fullorder = await Order.findOne({ userID: req.session.userId }).sort({
                createdAt: -1
            }).limit(1)
            const orderid = fullorder._id
            await Order.findOneAndUpdate({ _id: orderid }, { $set: { status: 'billed' } })
            res.render('orderSuccess', { count: count })
        }
    } catch (error) {
        console.log(error);
    }
}


const orderSuccess = async (req, res, next) => { //for paypal and razor pay
    try {
        if(req.query.id){
            const del = await Cart.deleteMany({ userID: req.session.userId })
        const count = 0
        const order = await Order.findByIdAndUpdate({ _id: req.query.id }, { $set: { status: 'billed' } })
        res.render('orderSuccess', { count: count })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const orderCancel = async (req, res, next) => { //for paypal and razor pay
    try {
        const count = 0
        const order = await Order.findByIdAndUpdate({ _id: req.query.id }, { $set: { status: 'cancelled' } })
        res.render('dashboard', { count: count,totalprice:0 })

    } catch (error) {
        console.log(error.message);
    }
}


const orderDetails = async (req, res) => {
    console.log("11");
    const orderid = req.query.id
    console.log('Query ID : ', orderid);
    const fullorder = await Order.findById({ _id: orderid }).populate('cartProduct.productID')
    const userCart = await Cart.findOne({ userID: req.session.userId })
    console.log(fullorder.cartProduct);
    if (userCart) {
        const count = userCart.cartProduct.length
        const totalprice = userCart.totalPrice
        res.render('orderDetails', {orderinfo:fullorder, order: fullorder.cartProduct, Tprice: fullorder, count: count, totalprice: totalprice });
    } else {
        res.render('orderDetails', {orderinfo:fullorder, order: fullorder.cartProduct, Tprice: fullorder, count: '', totalprice: '' });
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
        const fulladdress = await Address.find({userID:req.session.userId})
        req.session.coupondisc = coupon.couponDiscount
        couponDiscount = coupon.couponDiscount
        if (coupon) {
            if (totalcart) {
                console.log(totalcart);
                const totalprice = totalcart.totalPrice
                console.log('Total price is here :', totalprice);
                const newtotalprice = totalprice - totalprice * (couponDiscount / 100)
                req.session.totalPrice = Math.ceil(newtotalprice/85)
                console.log(req.session);
                res.render('checkout', { message: '',seladdress:'', fulladdress:fulladdress, subtotal: totalprice, fullorder: fulluser, coupondisc: req.session.coupondisc, totalPrice: req.session.totalPrice, coupon: req.session.couponcode, count: count, totalprice: '' })
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




const Addaddress = async (req, res, next) => {
    //const fulluser = await User.findOne({ userID: req.session.userId })

        const address = new Address({
        
        userID : req.session.userId,
        firstname : req.body.firstname,
        email : req.body.email,
        mobileno : req.body.mobileno,
        CompanyName : req.body.CompanyName,
        Country : req.body.Country,
        StreetAddress : req.body.StreetAddress,
        Apartment : req.body.Apartment,
        City : req.body.City,
        State : req.body.State,
        postcode : req.body.postcode,
        })

    console.log(address);

    await address.save()

    res.redirect('/dashboard')
}

const deleteaddress = async(req,res,next) => {
    await Address.findByIdAndDelete({_id:req.query.id})
    res.redirect('/dashboard')
}

const selectaddress = async (req, res, next) => {
    try {
        // req.session.totalPrice = ''
        // req.session.coupondisc = ''
        // req.session.couponcode = ''
        const fulladdress = await Address.find({ userID: req.session.userId })
        const seladdress = await Address.findById({ _id: req.query.id })
        const fulluser = await User.findOne({ userID: req.session.userId })
        const userCart = await Cart.findOne({ userID: req.session.userId })
        const count = userCart.cartProduct.length
        const totalprice = userCart.totalPrice
        const fullcart = await Cart.findOne({ userID: req.session.userId })
        // const totalPrice = fullcart.totalPrice
        const mathprice = fullcart.totalPrice/85
        req.session.totalPrice = Math.ceil(mathprice)
        res.render('checkout', { message: '',seladdress:seladdress, fulladdress:fulladdress, subtotal: totalprice, fullorder: fulluser, totalPrice: req.session.totalPrice, coupondisc: req.session.coupondisc, coupon: req.session.couponcode, count: count, totalprice: totalprice })

    } catch (error) {
        // if (error) {
        //     res.redirect('/')
        // }
        console.log(error);
    }
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
    orderSuccess,
    wishlist,
    addwishlist,
    applyCoupon,
    Addaddress,
    selectaddress,
    deleteaddress,
    userLogout,
    isLoggedIn,
    isLoggedOut,
    ottp,
    sendMessage,
    orderCancel
}