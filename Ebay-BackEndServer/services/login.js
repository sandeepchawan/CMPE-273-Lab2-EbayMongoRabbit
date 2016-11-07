var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";

//For login
function handle_request(msg, callback){

	switch(msg.type){
		case "login":
			handle_login(msg, callback);
			break;
		case "register":
			handle_register(msg, callback);
			break;
		case "homepage":
			handle_homepage(msg, callback);
			break;
		default:
			callback(null, false);
			break;
	}
}

//For login
function handle_login(msg, callback) {
	var res = {};
	console.log("In handle request: "+ msg.username);

	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);

		var coll = mongo.collection('users');

		coll.findOne({user_email: msg.username, user_password:msg.password}, function(err, user){
			if (err) {
				throw err;
			}
			if (user) {
				console.log("User found in DB");
				//req.session.user = user;
				console.log(" Before Setting login time for user");
				var time = new Date().toISOString().slice(0, 19).replace('T', ' ');    //update login time
				coll.update({user_email: msg.username}, {$set: {user_loginTime: time}}, function(err, user1) {
					if (err)
						throw err;
					console.log("Setting login time for user");
				});
				console.log(" After Setting login time for user");
				res.user = user;
				res.code = "200";
				//ebaylogger.clicklogger.log('info', req.param("username") + ' logged in');
				callback(null, res);

			} else {
				res.code = "401";
				res.value="Failed Login";
				//ebaylogger.clicklogger.log('info', req.param("username") + ' failed to login');
				callback(null, res);
			}
		});
	});

}

//For register
function handle_register(msg, callback){

	var res = {};
	console.log("In handle Register: "+ msg.user_email);

	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('users');

		coll.findOne({user_email: msg.user_email, user_password:msg.user_password}, function(err, user){
			if (err) {
				throw err;
			}
			if (user) {
				//ebaylogger.clicklogger.log('info', 'Registration failed, user ' +firstname + ' is already registered');
				console.log("User already registered!");
				res.code = "401";
				res.value = "Failed Register";
				callback(null, res);
			} else {
				coll.insertOne({
					user_firstName: msg.user_firstName,
					user_lastName: msg.user_lastName,
					user_email: msg.user_email,
					//   userpassword: sha256_password,
					user_password: msg.user_password,
					user_address: msg.user_address,
					user_city: msg.user_city,
					user_state: msg.user_state,
					user_zip: msg.user_zip,
					user_phone: msg.user_phone,
					user_dob: msg.user_dob,
					user_handle: msg.user_handle,
					user_balance: msg.user_balance,
					user_loginTime : 0,
					user_spent: 0,
					user_earned: 0}, function(err, user) {

					if (err) {
						throw err;
						console.log("Error while inserting: ", err);
						res.code = "401";
						res.value = "Failed Register";
					} else {
						console.log("New user entry inserted into collection");
						res.code = "200";
						res.value = "Success Register";
					}
					callback(null, res);
				});
			}
		});
	});
}

function handle_homepage(msg, callback) {
	var res= {};
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);

		var categoryColl = mongo.collection('category');
		var productColl = mongo.collection('product');

		categoryColl.find({}).toArray(function(err, categories){
			if (err)
				throw err;
			if (categories) {
				//console.log("Categories loaded: ", categories);
				//Load all products:
				productColl.find({}).toArray(function(err, products) {
					if (err)
						throw err;
					// console.log("Products loaded: ", products);
					    res.code = 200;
						res.categories =  categories;
						res.products = products;
					    callback(null, res);
				});
			} else {
				res.code = "401";
				callback(null, res);
			}
		});
	});
}
exports.handle_request = handle_request;
//exports.handle_register = handle_register;