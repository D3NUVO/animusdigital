require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')
const session = require('express-session')
const flash = require('connect-flash')

mongoose.connect((process.env.DBNAME), () => {
  console.log("Database Connected at port 27017 successfully...")
})


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//session
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
  secret: "thisismysecrctekey",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

app.use(flash())


//adminRoute
adminRoute.set('view engine', 'ejs')
adminRoute.set('views', './views/admin')
adminRoute.use('/', express.static('public'))
adminRoute.use('/', express.static('public/admin'))

//userRoute
userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/users')
userRoute.use('/', express.static('public'))
userRoute.use('/', express.static('public/user'))



//clear cache when switching pages!!!
app.use(function (req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
})


app.use('/', userRoute)


app.use('/admin', adminRoute)

app.use(function (req, res) {
  res.status(404).redirect("/");
});

app.listen(process.env.PORT, () => {
  console.log("Server is running...");
})