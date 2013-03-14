var x = require('../index');
var assert = require('assert');
var __DEBUG__ = false;
var tests = {};

tests.geared1 = function(){
  var fn = function(callback){
    callback(null,1);
  }
  x.geared([
      {func:fn, result:'a'},
      {func:fn, result:'b'}
  ],
  function(err, data){
    assert.equal(data.a, 1);
    assert.equal(data.b, 1);
    assert.equal(err,null);
  });
}

tests.geared2 = function(){
  var i = 3;
  var fn = function(callback){
    callback(null,i++);
  }
  x.geared([
      {func:fn, result:'a'},
      {func:fn, result:'b'}
  ],
  function(err, data){
    assert.equal(data.a, 3);
    assert.equal(data.b, 4);
    assert.equal(err,null);
  });
}

tests.geared3a = function(){
  var fn1 = function(callback){
    callback(null,5);
  }
  var fn2 = function(a, callback){
    callback(null,a+2);
  }
  x.geared([
      {func:fn1, result:'a'},
      {func:fn2, result:'b', args:['a']}
  ],
  function(err, data){
    assert.equal(data.a, 5);
    assert.equal(data.b, 7);
    assert.equal(err,null);
  });
}

var Call = x.Call;

tests.geared3b = function(){
  var fn1 = function(callback){
    callback(null,5);
  }
  var fn2 = function(a, callback){
    callback(null,a+2);
  }
  x.geared([
    Call(fn1).resultin('a'),
    Call(fn2).resultin('b').withargs('a')
  ],
  function(err, data){
    assert.equal(data.a, 5);
    assert.equal(data.b, 7);
    assert.equal(err,null);
  });
}



tests.geared4 = function(){
  var fn1 = function(callback){
    callback(null,5);
  }
  var fn2 = function(a, callback){
    callback(null,a+2);
  }
  x.geared([
      {func:fn1, result:'a'},
      {func:fn2, result:'b', args:['a']}
  ],
  function(err, data){
    assert.equal(data.a, 5);
    assert.equal(data.b, 7);
    assert.equal(err,null);
  });
}

tests.geared5 = function() {
  x.geared([ 
  function(callback) {
    callback(null, 5);
  },
  function(callback) {
    callback(null, 9);
  } ], 
  function(err, data) {
    assert.equal(data._1, 5);
    assert.equal(data._2, 9);
    assert.equal(err, null);
  });
}

tests.geared6 = function() {
  x.geared(
    function(callback) {
      callback(null, 8);
    }, 
    function(callback) {
      callback(null, 11);
    }, 
    function(err, data) {
      assert.equal(data._1, 8);
      assert.equal(data._2, 11);
      assert.equal(err, null);
    }
  );
}

for ( var test in tests) {
  console.log('Running ' + test);
  tests[test]();
}