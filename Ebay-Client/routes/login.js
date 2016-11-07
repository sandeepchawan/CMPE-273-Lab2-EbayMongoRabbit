var ebaylogger = require('./ebaylogger');
var ejs = require('ejs');
var sha256 =  require('crypto-js/sha256');
var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";
var mq_client = require('../rpc/client');

var invalid_login = false;
var invalid_first_name = false;
var invalid_last_name = false;
var invalid_email = false;
var invalid_city = false;
var invalid_state = false;
var invalid_zip = false;
var invalid_phone = false;
var email_already_used = false;

exports.login = function(req, res) {
    console.log("Rendering LOGIN page");
    res.render('login', {
        title : 'Sign in or Register | eBay',
        invalid_login: invalid_login,
        invalid_first_name: invalid_first_name,
        invalid_last_name: invalid_last_name,
        invalid_email: invalid_email,
        invalid_city:invalid_city,
        invalid_state:invalid_state,
        invalid_zip : invalid_zip,
        invalid_phone : invalid_phone,
        email_already_used : email_already_used
    });
};

exports.validateUser = function(req, res) {

  /*  var getUser = "select * from user, seller, buyer where (user_email, user_password) = ('"+ req.param("username") + "', '" + sha256(req.param("password")) + "') and user.user_id = seller.user_id and user.user_id = buyer.user_id";
    console.log("Query is: " + getUser);*/
    ebaylogger.clicklogger.log('info', req.param("username") + ' trying to login');

    var username = req.param("username");
    var password = req.param("password");

   /* mq_client.make_request('login_queue',msg_payload, function(err,results){

        console.log(results);
        if(err){
            throw err;
        }
        else
        {
            if(results.code == 200){
                console.log("valid Login");
                res.send({"login":"Success", "username":username});
            }
            else {

                console.log("Invalid Login");
                res.send({"login":"Fail"});
            }
        }
    });*/


    mongo.connect(mongoURL, function(){
        console.log('Connected to mongo at: ' + mongoURL);

        var coll = mongo.collection('users');

        coll.findOne({user_email: username, user_password:password}, function(err, user){
            if (user) {
                console.log("User found in DB");
                // This way subsequent requests will know the user is logged in.
                req.session.user = user;
                //console.log(req.session.user +" is the session");
                //update login time
                console.log(" Before Setting login time for user");
                var time = new Date().toISOString().slice(0, 19).replace('T', ' ');    //update login time
                coll.update({user_email: username}, {$set: {user_loginTime: time}}, function(err, user1) {
                    if (err)
                        throw err;
                    console.log("Setting login time for user");
                });
                console.log(" After Setting login time for user");
                json_responses = {"statusCode" : 200};
                ebaylogger.clicklogger.log('info', req.param("username") + ' logged in');
                res.send(json_responses);

            } else {
                console.log("User entry not found, returned false");
                json_responses = {"statusCode" : 401};
                ebaylogger.clicklogger.log('info', req.param("username") + ' failed to login');
                res.send(json_responses);
            }
        });
    });

};

exports.register = function(req, res) {
    var firstname = req.param("firstname");
    var lastname = req.param("lastname");
    var email = req.param("email");
    var password = req.param("password");
    var address = req.param("address");
    var city = req.param("city");
    var state = req.param("state");
    var zip = req.param("zip");
    var phone = req.param("phone");
    var dob = req.param("dob");
    var balance = 1000;
    var handle = email.split("@")[0]; //set handle from email
    console.log("handle is:", handle);
    var sha256_password = sha256(password);

    console.log('Registering new user ' + email);
    ebaylogger.clicklogger.log('info', 'New user ' + email + ' trying to register');

    //Can do some basic checks for ZIP, PHONE, DOB etc.

    var regZip = new RegExp("^\\d{5}(-\\d{4})?$");
    var regPhone = new RegExp("^\\d{10}");
    var regName = new RegExp("[a-zA-Z]+(?:(?:\. |[' ])[a-zA-Z]+)*");

    if (!regName.test(firstname)) {
        console.log("Invalid Firstname");
        invalid_first_name = true;
    }

    if (!regName.test(lastname)) {
        console.log("Invalid last_name");
        invalid_last_name = true;
    }

    if (!regZip.test(zip)) {
        console.log("Invalid zip");
        invalid_zip = true;
    }

    if (!regPhone.test(phone)) {
        console.log("Invalid Phone");
        invalid_phone = true;
    }

    if (!regName.test(city)) {
        console.log("Invalid city");
        invalid_city = true;
    }

    if (!regName.test(state)) {
        console.log("Invalid state");
        invalid_state = true;
    }

// If any of the input validation fails, stop and redirect to login
    if (invalid_first_name || invalid_last_name || invalid_zip || invalid_email || invalid_phone
        || invalid_city || invalid_state) {
        console.log("invalid registration fields! Redirect!");
        ebaylogger.clicklogger.log('info', 'New user ' + firstname + ' entered invalid details while registering');
        res.redirect('/login');
    } else {
        var msg_payload = {
            "type" : "register",
            "user_firstName": firstname,
            "user_lastName": lastname,
            "user_email": email,
            //   userpassword: sha256_password,
            "user_password": password,
            "user_address": address,
            "user_city": city,
            "user_state": state,
            "user_zip": zip,
            "user_phone": phone,
            "user_dob": dob,
            "user_handle": handle,
            "user_balance": balance
        };

        mq_client.make_request('login_queue', msg_payload, function (err, results) {

          //  console.log(results);
            if (err) {
                throw err;
            }
            else {
                if (results.code == 200) {
                    console.log("valid Register");
                    res.redirect('/');
                }
                else {
                    console.log("Invalid Register");
                    res.redirect('/');
                }
            }
        });
    }
};


exports.redirectToHomepage = function(req, res) {
    /*var categoryName = "SELECT * FROM category";
    var productName = "SELECT * FROM product";*/
    if (!req.session.user) {
        console.log("Session is invalid!! Redirect!");
        res.redirect('/');
        return;
    }

    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    var msg_payload = {"user":req.session.user, "type":"homepage"};

    console.log("Redirecting to homepage");
    console.log("User is: ", req.session.user.user_firstName);
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is being redirected to homepage');

    mq_client.make_request('login_queue', msg_payload, function (err, results) {

       // console.log(results);
        if (err) {
            throw err;
        }
        else {
            if (results.code == 200) {
                res.render('homepage', {
                    title: 'HOMEPAGE',
                    user: req.session.user,
                    categories: results.categories,
                    products: results.products
                });
            }
            else {
                console.log("Invalid user");
                res.redirect('/');
            }
        }
    });

};

exports.logout = function(req, res){
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is being logged out');
    req.session.user= null;
    req.session.product = null;
    req.session.destroy();
    res.redirect('/');
};
