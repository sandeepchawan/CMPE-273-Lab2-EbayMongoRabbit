var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";
var ebaylogger = require('./ebaylogger');
var mq_client = require('../rpc/client');

exports.show = function(req, res) {

  if (req.session.user.user_id == req.params.id) {
    ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is checking his account') ;
    res.redirect('/myAccount');
  } else {
    res.redirect('/login');
  }

};

exports.account = function(req, res){
  if (!req.session.user) {
    res.redirect('/');
  }
  ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is checking his account') ;
  var msg_payload = {"user": req.session.user};
  mq_client.make_request('user_queue',msg_payload, function(err,results){

    //console.log("Result from user_queue ", results);
    if(err){
      throw err;
    }
    else
    {
      if(results.code == 200){
        res.render('myAccount', {
          title: 'My Account',
          user: results.user,
          userinfo: results.user,
          soldinfo: results.user.sellHistory,
          purchaseinfo: results.user.purchaseHistory
        });
      }
      else {
        console.log("Error code 401 !!!!!! Redirecting from account to /");
          res.redirect('/');
      }
    }
  });
};

exports.purchaseHistory = function(req, res){
  if (!req.session.user) {
    res.redirect('/');
  }
  ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is checking his purchase history') ;
  var msg_payload = {"user": req.session.user};
  mq_client.make_request('user_queue',msg_payload, function(err,results){

    //console.log(results);
    if(err){
      throw err;
    }
    else
    {
      if(results.code == 200){
        res.render('purchaseHistory', {
          title: 'Purchase History',
          user: results.user,
          userinfo: results.user,
          purchaseInfo: results.user.purchaseHistory
        });
      }
      else {
        res.redirect('/');
      }
    }
  });
};

exports.sellHistory = function(req, res){
  if (!req.session.user) {
    res.redirect('/');
  }
  ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is checking his sell history') ;
  var msg_payload = {"user": req.session.user};

  mq_client.make_request('user_queue',msg_payload, function(err,results){

    //console.log(results);
    if(err){
      throw err;
    }
    else
    {
      if(results.code == 200){
        res.render('sellHistory', {
          title: 'Sell History',
          user: results.user,
          userInfo: results.user,
          soldInfo: results.user.sellHistory
        });
      }
      else {
        res.redirect('/');
      }
    }
  });

};


exports.bidHistory = function(req, res) {
  if (!req.session.user) {
    res.redirect('/');
  }
  ebaylogger.clicklogger.log('info', 'User ' + req.session.user.user_firstName + ' is checking his bid history') ;
  var msg_payload = {"user": req.session.user};
  mq_client.make_request('user_queue',msg_payload, function(err,results){

    //console.log(results);
    if(err){
      throw err;
    }
    else
    {
      if(results.code == 200){
        res.render('bidHistory', {
          title: 'Bid History',
          user: results.user,
          result: results.user.bidHistory
        });
      }
      else {
        res.redirect('/');
      }
    }
  });
};