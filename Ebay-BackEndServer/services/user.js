var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";

function handle_user(msg, callback) {

    console.log("Handling user");
    var res= {};
    mongo.connect(mongoURL, function(){
        console.log('Connected to mongo at: ' + mongoURL);

        var coll = mongo.collection('users');
        var user_id_object = require('mongodb').ObjectID(msg.user._id);

        coll.findOne({_id: user_id_object}, function(err, user){
            console.log('Query Ran, user on the way or not? !!');
            if (err)
                throw err;
            else {
                console.log('User found, render mY Account Page !!');
                res.code = 200;
                res.user = user;
                callback(null, res);
            }
        });
    });
}

exports.handle_user = handle_user;