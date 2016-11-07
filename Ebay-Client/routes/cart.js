var ebaylogger = require('./ebaylogger');
var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";
var mq_client = require('../rpc/client');

//Get CART details
exports.cart = function (req, res) {

    //var user_id = req.session.user.user_id;
    var user = req.session.user;
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is checking the items in his cart');
    var msg_payload = {"user": req.session.user, "type":"showCart"};
    var cart_total = 0;

    mq_client.make_request('cart_queue',msg_payload, function(err,results){

        //console.log("Result from user_queue ", results);
        if(err){
            throw err;
        }
        else
        {
            if(results.code == 200){
                if (results.total){
                    cart_total = results.total;
                }
                res.render('cart', {
                    title: 'Shopping Cart',
                    items: results.user.cart,
                    total: cart_total,
                    user: results.user,
                });
            }
            else {
                console.log("Error code 401 !!!!!! Redirecting from account to /");
                res.redirect('/');
            }
        }
    });
};

exports.addToCart = function (req, res) {
    //var user_id = req.session.user.user_id;
    var user = req.session.user;

    var product_id = req.body.product_id;
    var seller_id = req.body.seller_id;
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is adding product' + product_id + 'to his cart');

    var msg_payload = {"user": req.session.user, "type":"addToCart", "product_id": product_id};

    mq_client.make_request('cart_queue',msg_payload, function(err,results){

        //console.log("Result from user_queue ", results);
        if(err){
            throw err;
        }
        else
        {
            if(results.code == 200){
                res.redirect('/cart');
            }
            else {
                console.log("Error code 401 !!!!!!");
                res.redirect('/');
            }
        }
    });
};

exports.payment = function (req, res) {
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is ready to make a payment');
    res.render("payment", {
        title: "Pay",
        user: req.session.user
    });
};

exports.checkout = function (req, res) {
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is trying to do a cart checkout');

    var cardnumber, expirydate, cvv;
    cardnumber = req.param("cardnumber");
    expirydate = req.param("expirydate");
    cvv = req.param("cvv");

    var msg_payload = {"user": req.session.user, "type":"checkout", "cardnumber":cardnumber, "expirydate":expirydate, "cvv":cvv };

    var json_responses;

    mq_client.make_request('cart_queue',msg_payload, function(err,results){

        //console.log("Result from user_queue ", results);
        if(err){
            throw err;
        }
        else
        {
            if(results.code == 200){
                json_responses = {"statusCode": 200};
                res.send(json_responses);
            }
            else {
                json_responses = {"statusCode": 401};
                res.send(json_responses);
            }
        }
    });
};

exports.thankyou = function (req, res) {
    res.render('thankYou', {
        title: 'ThankYou',
        user: req.session.user
    });
};

//Remove item from cart
exports.remove = function (req, res) {


    var product_id = req.params.pid;
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is removing product ' + product_id + ' from his cart');

    var msg_payload = {"user": req.session.user, "type":"removeFromCart", "product_id": product_id};

    mq_client.make_request('cart_queue',msg_payload, function(err,results){

        //console.log("Result from user_queue ", results);
        if(err){
            throw err;
        }
        else
        {
            res.redirect('/cart');
        }
    });
};
