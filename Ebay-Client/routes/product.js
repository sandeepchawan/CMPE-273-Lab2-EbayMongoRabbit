var ebaylogger = require('./ebaylogger');
var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";
var mq_client = require('../rpc/client');

exports.listproducts = function (req, res) {
    console.log("in list products");
    var cid = req.params.cid;
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is listing products in category ' + cid);
    var sqlquery = "select * from product where product_category_id = " + cid;
    console.log("Query is: " + sqlquery);
    mysql.fetchData(function (err, result) {
        if (err) {
            console.log("Query failed:", sqlquery);
            throw err;
        }
        else {
            console.log(result);
            res.send(result);
        }
    }, sqlquery);
};

exports.showProduct = function (req, res) {
    if (!req.session.user) {
        res.redirect('/login');
    }
    var product_id = req.params.pid;
    console.log("Show product for product_id= ", product_id);
    //ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is viewing product ' + product_id);

    var msg_payload = {"type": "showProduct", "product_id": product_id};

    mq_client.make_request('product_queue', msg_payload, function (err, results) {

      //  console.log(results);
        if (err) {
            throw err;
        }
        else {
            if (results.code == 200) {
                req.session.product = results.product;
                res.render('productInfo', {
                    title: results.product.product_name,
                    user: req.session.user,
                    product: results.product,
                    categories: results.categories
                });
            }
            else {
                res.redirect('/');
            }
        }
    });
};

exports.sell = function (req, res) {

    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is trying to sell a product');
    var msg_payload = {"type": "sell"};

    mq_client.make_request('product_queue', msg_payload, function (err, results) {

       // console.log(results);
        if (err) {
            throw err;
        }
        else {
            if (results.code == 200) {
                res.render('sellProduct', {
                    title: 'Sell Product',
                    show: results.categories,
                    user: req.session.user
                });
            }
            else {
                res.redirect('/');
            }
        }
    });
};

exports.directSell = function (req, res) {

    if (!req.session.user) {
        res.redirect('/');
    }

    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is trying to sell a product directly');
    console.log("DIRECT SELL !!!!");
    var name = req.body.productName;
    var quantity = req.body.productQty;
    var desc = req.body.productDesc;
    var cat_id = req.body.productCategory;
    var condition = req.body.productCondition;
    var type = 0;
    var price = req.body.productPrice;
    var category_name = "";
    //set category name
    if (cat_id == 1) {
        category_name = "Motors";
    } else if (cat_id == 2) {
        category_name = "Fashion";
    } else if (cat_id == 3) {
        category_name = "Electronics";
    } else if (cat_id == 4) {
        category_name = "Collectibles&Arts";
    } else if (cat_id == 5) {
        category_name = "Home&Garden";
    } else if (cat_id == 6) {
        category_name = "SportingGoods";
    } else if (cat_id == 7) {
        category_name = "Toys&Hobbies";
    } else if (cat_id == 8) {
        category_name = "Business&Industrial";
    } else if (cat_id == 9) {
        category_name = "Music";
    } else if (cat_id == 10) {
        category_name = "Other";
    }

    var msg_payload = {"type":"directSell", "user": req.session.user, "name":name,"quantity":quantity, "desc":desc, "cat_id":cat_id,"condition":condition,
                        "typeofsell":type, "price":price, "category_name":category_name };
    mq_client.make_request('product_queue', msg_payload, function (err, results) {

        //console.log(results);
        if (err) {
            throw err;
        }
        else {
            if (results.code == 200) {
                console.log("Ad posted succesfully");
                res.redirect('/homepage');
            }
            else {
                res.redirect('/');
            }
        }
    });
};

exports.auctionSell = function (req, res) {
    if (!req.session.user) {
        res.redirect('/');
    }

        ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is trying to sell a product via auction');
        var name = req.body.productName;
        var quantity = 1;
        var desc = req.body.productDesc;
        var cat_id = req.body.productCategory;
        var condition = req.body.productCondition;
        var type = 1; //Auction sell, type == 0 for Direct sell
        var end = new Date();
        var endtime = new Date(end.valueOf() + 4 * 24 * 60 * 60 * 1000); //4 day end for bidding
        var starttime = new Date();
        console.log("bid start time is", starttime);
        var startprice = req.body.productStartPrice;

        var category_name = "";
        //set category name
        if (cat_id == 1) {
            category_name = "Motors";
        } else if (cat_id == 2) {
            category_name = "Fashion";
        } else if (cat_id == 3) {
            category_name = "Electronics";
        } else if (cat_id == 4) {
            category_name = "Collectibles&Arts";
        } else if (cat_id == 5) {
            category_name = "Home&Garden";
        } else if (cat_id == 6) {
            category_name = "SportingGoods";
        } else if (cat_id == 7) {
            category_name = "Toys&Hobbies";
        } else if (cat_id == 8) {
            category_name = "Business&Industrial";
        } else if (cat_id == 9) {
            category_name = "Music";
        } else if (cat_id == 10) {
            category_name = "Other";
        }

    var msg_payload = {"type":"directSell", "user":req.session.user, "name":name,"quantity":quantity, "desc":desc, "cat_id":cat_id,"condition":condition,
        "typeofsell":type, "end":end, "category_name":category_name,"endtime":endtime,"starttime":starttime,"startprice":startprice};

    mq_client.make_request('product_queue', msg_payload, function (err, results) {

      //  console.log(results);
        if (err) {
            throw err;
        }
        else {
            if (results.code == 200) {
                console.log("Ad posted succesfully");
                res.redirect('/homepage');
            }
            else {
                res.redirect('/');
            }
        }
    });
};

//Search Product
exports.search = function (req, res) {
    var text = req.param("productName");
    var cat = req.body.cat;

    console.log("Product being searched for is: ", text);
    console.log("Category of product being searched is: ", cat);

    //var categoryQuery = "SELECT * FROM category";
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is searching for a product in category' + cat);
    var msg_payload = {"type":"search", "text":text,"cat":cat };

    mq_client.make_request('product_queue', msg_payload, function (err, results) {

        console.log("******** Got results from product search !!");
        console.log("RESULTS form search", results);
        if (err) {
            throw err;
        }
        else {
            if (results.code == 200) {
                if (results.returnSearch == "searchByName") {
                    console.log("SEARCH BY NAME");
                if (!results.products) {
                    console.log("SEARCH BY NAME, no products, render FAIL SEARCH PAGE");
                    res.render('failSearch', {
                        title: 'fail search'
                    });
                } else {
                    console.log("SEARCH BY NAME, product found, render HOME PAGE");
                    res.render('homepage', {
                        title: results.products.product_name,
                        user: req.session.user,
                        categories: results.categories,
                       // categories: results.products.product_category_name,
                        products: results.products
                    });
                }
                }
                if (results.returnSearch == "searchByCategory"){
                    console.log("SEARCH BY CATEGORY");
                    if (!results.products) {
                        console.log("SEARCH BY CAT, no products, render FAIL SEARCH PAGE");
                        res.render('failSearch', {
                            title: 'fail search'
                        });
                    } else {
                        console.log("SEARCH BY CAT, product found, render HOME PAGE");
                        res.render('homepage', {
                            title: results.products[0].product_category_name,
                            user: req.session.user,
                            categories: results.categories,
                           // categories: results.products[0].product_category_name,
                            products: results.products
                        });
                    }
                }
            }
            else {
                console.log("SEARCH - CODE 401, RENDER FAIL PAGE!");
                res.render('failSearch', {
                    title: 'fail search'
                });
            }
        }
    });
};


exports.bid = function (req, res) {
    if (!req.session.user || !req.session.product) {
        // res.redirect('/login');
        res.redirect('/');
    }
    var time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    ebaylogger.bidlogger.log('info', 'User ' + req.session.user.user_firstName + ' is bidding for product ' + req.session.product.product_id);
    if (req.body.quantity == 0) {
        res.send('Sold OUT');
    }
    else {
        var msg_payload = {"type":"bid", "user":req.session.user,
             "myprice": req.body.myprice, "time": time, product: req.session.product};

        mq_client.make_request('product_queue', msg_payload, function (err, results) {

          //  console.log(results);
            if (err) {
                throw err;
            }
            else {
                if (results.code == 200) {
                    res.redirect('/homepage');
                }
                else {
                    res.redirect('/');
                }
            }
        });
    }
};