/**

 */
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var mongo = require('./mongo');
var loginDatabase = "mongodb://localhost:27017/ebay";

module.exports = function(passport) {
   /* passport.serializeUser(function(user, done) {
        console.log("serializeUser "+JSON.stringify(user));
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });*/

    passport.use('login', new LocalStrategy(function(username, password, done) {

        mongo.connect(loginDatabase, function(connection) {

            var loginCollection = mongo.connectToCollection('users', connection);
            var whereParams = {
                user_email:username,
                user_password:password
            }

            process.nextTick(function(){
                loginCollection.findOne(whereParams, function(error, user) {

                    if(error) {
                        return done(err);
                    }

                    if(!user) {
                        return done(null, false);
                    }

                    if(user.user_password != password) {
                        done(null, false);
                    }

                    connection.close();
                    console.log(user.user_email);
                    done(null, user);
                });
            });
        });
    }));
};



