var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";

function handle_request(msg, callback){

    switch(msg.type){
        case "showProduct":
            console.log("Call showProduct function after deciding message type = showProduct");
            handle_showProduct(msg, callback);
            break;
        case "sell":
            handle_sell(msg, callback);
            break;
        case "directSell":
            handle_directSell(msg, callback);
            break;
        case "auctionSell":
            handle_auctionSell(msg, callback);
            break;
        case "search":
            handle_search(msg, callback);
            break;
        case "bid":
            handle_bid(msg, callback);
            break;
        default:
            callback(null, false);
            break;
    }
}

function handle_showProduct(msg, callback) {
    var res={};
    console.log("In show product on server");
    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo in showProduct at: ' + mongoURL);
        var productColl = mongo.collection('product');
        var catColl = mongo.collection('category');
        console.log("In show product on server - fetching tables");
        var product_id_object = require('mongodb').ObjectID(msg.product_id);
        productColl.findOne({_id: product_id_object}, function (err, product) {
            if (err) {
                console.log("In show product on server - Error product not found");
                throw err;
            } else {
                catColl.find({}).toArray(function (err, categories) {
                    if (err) {
                        console.log("In show product on server - Error category not found");
                        throw err;
                    }
                    else {
                        console.log("In show product on server - Product found, return product");
                        res.code = 200;
                        res.product = product;
                        res.categories = categories;
                        callback(null, res);
                    }
                });
            }
        });
    });
    console.log("In show product on server - End of function");
}

function handle_sell(msg, callback) {
    var res={};
    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);
        var coll = mongo.collection('category');

        coll.find({}).toArray(function (err, categories) {
            if (err) {
                throw err;
            } else {
                res.code = 200;
                res.show = categories;
                callback(null, res);
            }
        });
    });
}


function handle_directSell(msg, callback) {
    var res={};

    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);
        var productColl = mongo.collection('product');
        productColl.insertOne({
            product_name: msg.name,
            product_category_id: msg.cat_id,
            product_category_name: msg.category_name,
            product_price: msg.price,
            product_condition: msg.condition,
            product_type: msg.typeofsell,
            // product_seller_id: seller_id,
            product_seller: msg.user,
            product_desc: msg.desc,
            product_stock: msg.quantity,
            product_bid_start_price: 0,
            product_bid_end_time: 0,
            Product_bid_start_time: 0,
            product_bid_end: 0,
            product_max_bid_price: 0
        }, function (err, result) {

            if (err) {
                console.log("Error while inserting: ", err);
                throw err;
            } else {
                console.log("Ad posted succesfully");
                res.code = 200;
                callback(null, res);
            }
        });
    });
}

function handle_auctionSell(msg, callback) {
    var res = {};

    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);
        var productColl = mongo.collection('product');

        productColl.insertOne({
            product_name: msg.name,
            product_category_id: msg.cat_id,
            product_category_name: msg.category_name,
            product_price: msg.startprice,
            product_condition: msg.condition,
            product_type: msg.typeofsell,
            // product_seller_id: seller_id,
            product_seller: msg.user,
            product_desc: msg.desc,
            product_stock: msg.quantity,
            product_bid_start_price: msg.startprice,
            product_bid_end_time: msg.endtime,
            Product_bid_start_time: msg.starttime,
            product_bid_end: 0,
            product_max_bid_price: 0
        }, function (err, result) {

            if (err) {
                console.log("Error while inserting: ", err);
                throw err;
            } else {
                console.log("Ad posted succesfully");
                res.code = 200;
                callback(null, res);
            }
        });

    });
}

function handle_search(msg, callback){
    var res = {};

    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);
        var coll = mongo.collection('category');
        var productColl = mongo.collection('product');

        coll.find({}).toArray(function (err, categories) {
            if (err) {
                throw err;
            } else {
                if (msg.text.length > 0) {
                    console.log ("Search - Caught product text name");
                    productColl.findOne({product_name: msg.text, product_category_id: msg.cat}, function (err, product) {
                        if (err)
                            throw err;
                        if (!product) {
                            console.log ("Search - product text name NO products found, send 401");
                            res.code = 401;
                            callback (null, res);
                         //   return;
                        } else {
                            console.log("Product returned from search is: ", product);
                            console.log ("Search -  product text name ! products found, send 200");
                                res.code = 200;
                                res.returnSearch = "searchByName";
                                res.categories =  categories;
                                res.products = product;
                            callback(null, res);
                         //   return;
                        }
                    });
                } else {
                    productColl.find({product_category_id: msg.cat}, function (err, products) {
                        console.log ("Search - No product text name");
                        if (err)
                            throw err;
                        if (!products) {
                            console.log ("Search - No product text name NO products found, send 401");
                            res.code = 401;
                            callback (null, res);
                          //  return;
                        } else {
                            console.log ("Search -  no product text name ! products found, send 200");
                            res.code = 200;
                            res.returnSearch = "searchByCategory";
                            res.categories = categories;
                            res.products = products;
                            callback (null, res);
                           // return;
                        }
                    });
                }
            }
        });
    });

}

function handle_bid (msg, callback) {
    var res={};
    mongo.connect(mongoURL, function () {
        console.log('Connected to mongo at: ' + mongoURL);

        var productColl = mongo.collection('product');
        var userColl = mongo.collection('users');
        var product_id_object = require('mongodb').ObjectID(msg.product._id);
        var user_id_object = require('mongodb').ObjectID(msg.user._id);

        var bidplaced = {bid_buyer: msg.user, bid_price: msg.myprice, bid_time: msg.time};
        var insertToBidHistory = {bid_product: msg.product, bid_price: msg.myprice, bid_time: msg.time};

        if (msg.myprice > msg.product.product_max_bid_price) {
            productColl.update({_id: product_id_object}, {$set: {product_max_bid_price: msg.myprice}}, function (err, product) {
                if (err)
                    throw err;
            });
        }
//Push bid history in user collection also?
        productColl.update({_id: product_id_object}, {$push: {bids: bidplaced}}, function (err, product) {
            if (err)
                throw err;
            userColl.update({_id: user_id_object}, {$push: {bidHistory: insertToBidHistory}}, function (err, user) {
                //Update the product with new bid values.
                if (err)
                    throw err;
                res.code = 200;
                callback(null, res);
            });
        });
    });

}

exports.handle_request = handle_request;
