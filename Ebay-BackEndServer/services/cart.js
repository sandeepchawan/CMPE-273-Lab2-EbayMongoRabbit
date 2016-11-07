var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";

function handle_request(msg, callback){

    switch(msg.type){
        case "showCart":
            handle_showCart(msg, callback);
            break;
        case "addToCart":
            handle_addToCart(msg, callback);
            break;
        case "checkout":
            handle_checkout(msg, callback);
            break;
        case "removeFromCart":
            handle_removeFromCart(msg, callback);
            break;
        default:
            callback(null, false);
            break;
    }
}

function handle_showCart(msg, callback){

    var res = {};
    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);

        var userColl = mongo.collection('users');
        var user_id_object = require('mongodb').ObjectID(msg.user._id);

        userColl.findOne({_id: user_id_object}, function (err, user) {
            if (err) {
                throw err;
            } else {
                var cart_total = 0;
                for (var i = 0; i < user.cart.length; i++) {
                    cart_total += parseInt(user.cart[i].product_price);
                }
                console.log("Cart total after calculation is: ", cart_total);
                res.items = user.cart;
                res.total = cart_total;
                res.user = user;
                res.code = 200;
                callback(null, res);
            }
        });
    });

}

function handle_addToCart(msg, callback) {
    var res = {};

    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);

        var productColl = mongo.collection('product');
        var userColl = mongo.collection('users');
        var user_id_object = require('mongodb').ObjectID(msg.user._id);
        var product_id_object = require('mongodb').ObjectID(msg.product_id);

        productColl.findOne({_id: product_id_object}, function (err, product) {
            if (err) {
                throw err;
            }
            if (product) {
                console.log("Product found in DB");
                console.log("Product is :", product);

                userColl.update({_id: user_id_object}, {$push: {cart: product}}, function (err, user) {
                    if (err) {
                        throw err;
                    } else {
                        res.code = 200;
                        callback(null, res);
                    }
                });
            }
        });

    });
}

function handle_checkout(msg, callback) {
    var res = {};
    var json_responses;

    //Do credit card validation //set isCardValid:
    var isCardValid = false;
    var regCardNumber = new RegExp("^\\d{16}$");
    var regExpiry = new RegExp("^\\d{4}$");
    var regCvv = new RegExp("^\\d{3}$");

    if (regCardNumber.test(msg.cardnumber) && regExpiry.test(msg.expirydate) && regCvv.test(msg.cvv)) {
        isCardValid = true;
    }

    console.log("card details:", msg.cardnumber, msg.expirydate, msg.cvv);
    console.log("Card is valid? : ", isCardValid);


    if (isCardValid) {
        console.log("Valid card");
        var user_id = msg.user._id;

        addTransaction(user_id, function (result) {
            decrementProductQuantity(user_id, function (result) {
                removeUserFromCart(user_id, function (result) {
                    res.code = 200;
                    callback(null, res);
                });
            });
        });


    }  else {
        console.log("Here J !!!");
        res.code = 401;
        callback(null, res);
    }

}

function handle_removeFromCart(msg, callback) {
    var res = {};

    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);

        var userColl = mongo.collection('users');
        var user_id_object = require('mongodb').ObjectID(msg.user._id);
        var product_id_object = require('mongodb').ObjectID(msg.product_id);

        userColl.update({_id: user_id_object}, {$pull: {cart: {_id: product_id_object}}}, function (err, user) {
            if (err) {
                throw err;
            } else {
                //all is well, item removed from cart
                res.code = 200;
                console.log("Item removed from cart");
                callback(null, res);
            }
        });

    });
}

function removeUserFromCart(user_id, callback) {

    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);

        var userColl = mongo.collection('users');
        var user_id_object = require('mongodb').ObjectID(user_id);

        userColl.update({_id: user_id_object}, {$set : {cart : []}}, function (err, user) {
            if (err) {
                throw err;
            }
            callback(user);
        });

    });

}

function decrementProductQuantity(user_id, callback) {
    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);

        var productColl = mongo.collection('product');
        var userColl = mongo.collection('users');
        var user_id_object = require('mongodb').ObjectID(user_id);

        userColl.findOne({_id: user_id_object}, function (err, user) {
            if (err) {
                throw err;
            }
            if (user) {
                //Decrement product stock
                for (var i = 0; i < user.cart.length; i++) {
                    var product_id_object = require('mongodb').ObjectID(user.cart[i]._id);
                    productColl.findOne({_id: product_id_object}, function (err, product) {
                        if (err) {
                            throw err;
                        } else {
                            var product_stock = parseInt(product.product_stock) - 1;
                            productColl.update({_id: product_id_object}, {$set: {product_stock: product_stock}}, function (err, product1) {
                                if (err) {
                                    throw err;
                                }
                            });
                        }
                    });

                }
                callback(user);
            }
        });

    });

}

function addTransaction(user_id, callback) {

    console.log("Adding Transaction to History !!!");
    //var user = req.session.user;

    mongo.connect(mongoURL, function () {
        console.log("Here 1 !!!");

        console.log('Connected to mongo at: ' + mongoURL);

        var userColl = mongo.collection('users');
        var user_id_object = require('mongodb').ObjectID(user_id);


        console.log("Here 2 !!!");
        userColl.findOne({_id: user_id_object}, function (err, user) {
            //Add products to buyers purchase history
            for (var i = 0; i < user.cart.length; i++) {
                user.cart[i].transactionTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                userColl.update({_id: user_id_object}, {$push: {purchaseHistory: user.cart[i]}}, function (err, userupdate) {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Products added to Purchase-history");
                    }
                });
            }
            //Decrement balance from purchaser
            var cart_total = 0;
            for (var k = 0; k < user.cart.length; k++) {
                cart_total += parseInt(user.cart[k].product_price);
            }
            var user_spent = 0;
            console.log("User Spent amount till now: ", parseInt(user.user_spent));
            user_spent = parseInt(user.user_spent) + cart_total;
            console.log("User Spent amount: ", user_spent);
            var user_balance = 0;
            console.log("User Balance amount before deducting: ", parseInt(user.user_balance));
            user_balance = parseInt(user.user_balance) - user_spent;
            console.log("User Balance amount after spending: ", user_balance);
            userColl.update({_id: user_id_object}, {$set: {user_spent: user_spent, user_balance: user_balance}}, function (err, userupdate1) {
                if (err) {
                    throw err;
                } /*else {
                 userColl.update({_id: user_id_object}, {$set: {user_balance: user_balance}}, function (err, userupdate2) {
                 if (err)
                 throw err;
                 });
                 }*/
            });

            //Add to sellers selling history! , increment balance
            for (var j = 0; j < user.cart.length; j++) {
                console.log("User cart length here 1 is :" , user.cart.length);
                var seller_id_object = require('mongodb').ObjectID(user.cart[j].product_seller._id);
                user.cart[j].transactionTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                var product = user.cart[j];
                userColl.update({_id: seller_id_object}, {$push: {sellHistory: product}}, function (err, seller1) {
                    if (err)
                        throw err;
                    else {
                        //Update earned, balance
                        userColl.findOne({_id: seller_id_object}, function (err, seller2) {
                            console.log("Product price is :", product.product_price);
                            console.log("Seller  earned amount till now: ", parseInt(seller2.user_earned));
                            var earned = parseInt(seller2.user_earned) + parseInt(product.product_price);
                            //    var earned = (seller2.user_earned) + (product.product_price);
                            console.log("Seller  earned amount after selling: ", earned);

                            console.log("Seller  balance amount before selling: ", parseInt(seller2.user_balance));
                            var balance = parseInt(seller2.user_balance) + parseInt(earned);
                            //var balance = (seller2.user_balance) + earned;
                            console.log("Seller  balance amount after selling: ", balance);

                            userColl.update({_id: seller_id_object}, {
                                $set: {
                                    user_earned: earned,
                                    user_balance: balance
                                }
                            }, function (err, seller2) {
                                if (err)
                                    throw err;
                                /*else {
                                 userColl.update({_id: seller_id_object}, {$set: {user_balance: balance}}, function (err, seller3) {
                                 if (err)
                                 throw err;
                                 });
                                 }
                                 */
                            });
                        });
                    }
                });
            }

        });

        callback();
    });
}

exports.handle_request = handle_request;
