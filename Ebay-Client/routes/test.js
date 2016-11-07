var superagent = require('superagent');
var expect = require('expect.js');

describe('cart', function(){
    it('should respond to cart request',function(){
        superagent
            .get('http://localhost:'+3000+'/cart')
            .end(function(res){
                expect(res.status).to.equal(200);
            })
    })
});


describe('Login test', function () {
    it('should create user session for valid user', function () {
        superagent
            .post('http://localhost:'+3000+'/validateuser')
            .set('Accept','application/json')
            .send({"username": "sand@sand", "password": "sand"})
            .end(function (err, res) {
                expect(res.status).to.equal(200);
            });
    });
});

describe('/homepage', function(){
    it('should respond to GET',function(){
        superagent
            .get('http://localhost:'+3000+'/homepage')
            .end(function(res){
                expect(res.status).to.equal(200);
            })
    })
});

describe('/myAccount', function(){
    it('should respond to account request',function(){
        superagent
            .get('http://localhost:'+3000+'/myAccount')
            .end(function(res){
                expect(res.status).to.equal(200);
            })
    })
});

describe('/', function(){
    it('should respond to GET',function(){
        superagent
            .get('http://localhost:'+3000)
            .end(function(res){
                expect(res.status).to.equal(200);
            })
    })
});
