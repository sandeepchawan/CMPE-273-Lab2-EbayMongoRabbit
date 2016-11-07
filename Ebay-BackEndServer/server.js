//super simple rpc server example
var amqp = require('amqp')
, util = require('util');
var mongo = require("./services/mongo");
var mongoURL = "mongodb://localhost:27017/ebay";

var login = require('./services/login');
var user = require('./services/user');
var cart = require('./services/cart');
var product = require('./services/product');

var cnn = amqp.createConnection({host:'127.0.0.1'});

	cnn.on('ready', function () {

		cnn.queue('login_queue', function (q) {
			q.subscribe(function (message, headers, deliveryInfo, m) {
				util.log(util.format(deliveryInfo.routingKey, message));
				util.log("Message: " + JSON.stringify(message));
				util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));
				login.handle_request(message, function (err, res) {

					//return index sent
					cnn.publish(m.replyTo, res, {
						contentType: 'application/json',
						contentEncoding: 'utf-8',
						correlationId: m.correlationId
					});
				});
			});
		});


		cnn.queue('register_queue', function (q) {
			q.subscribe(function (message, headers, deliveryInfo, m) {
				util.log(util.format(deliveryInfo.routingKey, message));
				util.log("Message: " + JSON.stringify(message));
				util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));
				login.handle_register(message, function (err, res) {

					//return index sent
					cnn.publish(m.replyTo, res, {
						contentType: 'application/json',
						contentEncoding: 'utf-8',
						correlationId: m.correlationId
					});
				});
			});
		});


		cnn.queue('user_queue', function (q) {
			q.subscribe(function (message, headers, deliveryInfo, m) {
				util.log(util.format(deliveryInfo.routingKey, message));
				util.log("Message: " + JSON.stringify(message));
				util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));
				user.handle_user(message, function (err, res) {

					//return index sent
					cnn.publish(m.replyTo, res, {
						contentType: 'application/json',
						contentEncoding: 'utf-8',
						correlationId: m.correlationId
					});
				});
			});
		});


		cnn.queue('cart_queue', function (q) {
			q.subscribe(function (message, headers, deliveryInfo, m) {
				util.log(util.format(deliveryInfo.routingKey, message));
				util.log("Message: " + JSON.stringify(message));
				util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));
				cart.handle_request(message, function (err, res) {

					//return index sent
					cnn.publish(m.replyTo, res, {
						contentType: 'application/json',
						contentEncoding: 'utf-8',
						correlationId: m.correlationId
					});
				});
			});
		});

		cnn.queue('product_queue', function (q) {
			q.subscribe(function (message, headers, deliveryInfo, m) {
				util.log(util.format(deliveryInfo.routingKey, message));
				util.log("Message: " + JSON.stringify(message));
				util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));
				product.handle_request(message, function (err, res) {

					//return index sent
					cnn.publish(m.replyTo, res, {
						contentType: 'application/json',
						contentEncoding: 'utf-8',
						correlationId: m.correlationId
					});
				});
			});
		});

	});