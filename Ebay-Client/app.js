var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var winston = require('winston');


//var session = require('client-sessions');

var mongoSessionConnectURL = "mongodb://localhost:27017/sessionsebay";
var expressSession = require("express-session");
var mongoStore = require("connect-mongo/es5")(expressSession);
var mongo = require("./routes/mongo");

var mongoURL = "mongodb://localhost:27017/ebay";

var passport = require('passport');
require('./routes/passport')(passport);

var routes = require('./routes');
var user = require('./routes/user');
var login = require('./routes/login');
var product = require('./routes/product');
var cart = require('./routes/cart');

var app = express();

app.use(expressSession({
    secret: 'cmpe273_teststring',
    resave: false,  //don't save session if unmodified
    saveUninitialized: false,	// don't create session until something stored
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    store: new mongoStore({
        url: mongoSessionConnectURL
    })
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3000);
// app.set('port', 8080);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
app.use(passport.initialize());

app.get('/', login.login);

// app.get('/login', login.login);
app.get('/login', isAuthenticated, function(req, res) {
    //res.render('homepage', {user:req.session.user});
    console.log("Rendering homepage from app.get('/login') after successful authentication");
    res.redirect('/homepage');
});

function isAuthenticated(req, res, next) {
    if(req.session.user) {
        console.log("User is authenticated");
        return next();
    }
    console.log("User is not authenticated, send him to login page");
    res.redirect('/');
};

// app.get('/logout', login.logout);
app.get('/logout', function(req,res) {
    req.session.destroy();
    //req.logout();
    res.redirect('/');
});

//POST REQUESTS
//app.post('/validateuser', login.validateUser);
app.post('/validateuser', function(req, res, next) {
    passport.authenticate('login', function(err, user, info) {
        if(err) {
            console.log("1 - Error here");
            return next(err);
        }

        if(!user) {
            console.log("2 - User not found in DB");
            //return next(err);
            return res.redirect('/');
        }

        req.logIn(user, {session:false}, function(err) {
            if(err) {
                console.log("3 - Error here");
                return next(err);
            }

            req.session.user = user;
            //console.log("User stored in session is: ", user);
            mongo.connect(mongoURL, function() {
                var coll = mongo.collection('users');
                var time = new Date().toISOString().slice(0, 19).replace('T', ' ');    //update login time
                coll.update({user_email: user.user_email}, {$set: {user_loginTime: time}}, function (err, user1) {
                    if (err)
                        throw err;
                    console.log("Setting login time for user");
                });
            });
            console.log("session initialized");
            //return res.render('successLogin', {user:user});
            console.log("Rendering homepage from app.post('/validateuser') after successful authentication");
            var json_responses = {"statusCode": 200};
            return res.send(json_responses);
        })
    })(req, res, next);
});

app.get('/homepage',login.redirectToHomepage);
app.get('/listproducts/:cid', product.listproducts);
app.get('/showproduct/:pid', product.showProduct);
app.get('/sell', product.sell);
app.post('/register', login.register);
app.post('/directsell', product.directSell);
app.post('/auctionsell', product.auctionSell);
app.post('/search', product.search);
app.get('/myaccount', user.account);
app.get('/user/:id', user.show);
app.get('/purchasehistory', user.purchaseHistory);
app.get('/sellhistory', user.sellHistory);
app.get('/bidhistory', user.bidHistory);
app.get('/cart', cart.cart);
app.post('/cart/remove/:pid', cart.remove);
app.get('/cart/remove', cart.cart);
app.get('/cart/remove/:pid', cart.cart);
app.post('/cart', cart.addToCart);
app.get('/payment', cart.payment);
app.get('/thankyou', cart.thankyou);
app.post('/checkout', cart.checkout);
app.post('/product/bid/:id', product.bid);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});

mongo.connect(mongoSessionConnectURL, function(){
    console.log('Connected to mongo at: ' + mongoSessionConnectURL);
    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ', app.get('port'));
    });
 });

module.exports = app;
