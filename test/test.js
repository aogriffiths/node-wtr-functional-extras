var x = require('extras');
var assert = require('assert');
var __DEBUG__ = false;

var tests = {}

tests.bind = function() {

  function A(x) {this.x = x;};
  
  A.prototype.fn = function(p, q, r) {
    return "" + this.x + p + q + r
  };
  var a = new A(1);

  assert.equal('1234', a.fn(2, 3, 4), 'Normal application');
  assert.equal('1234', x.bindpartial(a, a.fn)(2, 3, 4), 'effictively just binds');
  assert.equal('1234', x.bindpartial(a, a.fn, 2)(3, 4), 'partially appplied');
  assert.equal('1234', x.bindpartial(a, a.fn, 2, 3)(4), 'partially appplied');
  assert.equal('1234', x.bindpartial(a, a.fn, 2, 3, 4)(), 'completely applied');
  assert.equal('1234', x.bindpartial(a, 'fn', 2, 3)(4), 'named function if you prefer not to repate the "a"');
  assert.equal('1234', x.bindpartial(a, 'fn', 2, undefined, 4)(3), 'using undefined as a placeholder for an argumemnt');
  assert.equal('1234', x.bindpartial(a, 'fn', undefined, 3, undefined)(2, 4), 'again, using undefined as a placeholder for an argumemnt');
}

tests.cache1 = function() {
  var cb1 = false;
  var cb2 = false;
  var value = 1;
  var A = function(callback){callback(null,value++)};
  var cachedA = x.cache(A, {timetostale:1000});
  cachedA(function(err,data){
    assert.equal(data,1,'first call. expected 1. got ' + data);
    cb1 = true;
  });
  cachedA(function(err,data){
    assert.equal(data,1,'second call cached. expected 1. got ' + data);
    cb2 = true;
  })
  setTimeout(function(){
    var cb3 = false;
    cachedA(function(err,data){
      assert.equal(data,2,'third call, not cached. expected 2. got ' + data);
      cb3 = true;
    })    
    assert.equal(cb3, true, 'callbacks must happen');
  },1300)
  assert.equal(cb1, true, 'callbacks must happen');
  assert.equal(cb2, true, 'callbacks must happen');
}

tests.cache2 = function() {
  var value = 1;
  var A = function(v, callback){callback(null,v + value++)};
  var cachedA = x.cache(A, {timetostale:1000});
  cachedA(1, function(err,data){
    assert.equal(err,null);
    assert.equal(data,2,'first call with 1. expected 2. got ' + data);
  });
  cachedA(2, function(err,data){
    assert.equal(err,null);
    assert.equal(data,4,'first call with 2. expected 4. got ' + data);
  })
  cachedA(1, function(err,data){
    assert.equal(err,null);
    assert.equal(data,2,'second call with 1. expected 2. got ' + data);
  });
  cachedA(2, function(err,data){
    assert.equal(err,null);
    assert.equal(data,4,'second call with 2. expected 3. got ' + data);
  })
  setTimeout(function(){
    cachedA(1, function(err,data){
      assert.equal(err,null);
      assert.equal(data,4,'third call with 1. expected 4. got ' + data);
    });
    cachedA(2, function(err,data){
      assert.equal(err,null);
      assert.equal(data,6,'third call with 2. expected 6. got ' + data);
    })
  },1300)
}

tests.timeoutNoTimeout = function() {
  var cb1 = false;
  var fn0 = function(callback){callback(null,1)};
  var fn1 = x.timeout(fn0, {timeout:500});
  fn1(function(err,data){
    assert.equal(data, 1, 'should not time out');
    assert.equal(err,null,'should not time out');
    cb1 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
}

tests.timeoutTimeout = function() {
  var cb1 = false;
  var fn0 = function(callback){setTimeout(function(){callback(null,1)},1000)};
  var fn1 = x.timeout(fn0, {timeout:500});
  fn1(function(err,data){
    assert.equal(data, null, 'timedout, should be no data');
    assert.equal(err,"Timed Out",'timedout, shoul dhave an error');
    cb1 = true;
  });
  setTimeout(function(){
    assert.equal(cb1, true, 'callbacks must happen');
  },1100)
}

//with multiple arguments
tests.timeout2 = function() {
  var cb1 = false;
  var A = function(a,b,c,callback){callback(null,a+b+c)};
  var timeoutA = x.timeout(A, {timeout:500});
  timeoutA(1,2,3, function(err,data){
    assert.equal(data, 6, 'should not time out');
    assert.equal(err,null,'should not time out');
    cb1 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
}

tests.catcherrNoArgs = function() {
  var cb1 = false;
  var fn0 = function(callback){callback(null,1)};
  var fn1 = x.catcherr(fn0,{});
  fn1(function(err,data){
    assert.equal(data, 1, 'should not err');
    assert.equal(err,null,'should not err');
    cb1 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
}

tests.catcherrMultipleArgs = function() {
  var cb1 = false;
  var fn0 = function(a,b,c,callback){callback(null,a+b+c)};
  var fn1 = x.catcherr(fn0);
  fn1(0,2,3, function(err,data){
    assert.equal(data, 5, 'should not err');
    assert.equal(err,null,'should not err');
    cb1 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
}

tests.catcherrWithErr = function() {
  var cb1 = false;
  var fn0 = function(a,b,c,callback){callback("error!",a+b+c)};
  var fn1 = x.catcherr(fn0);
  fn1(0,2,3, function(err,data){
    assert.equal(data, 5, 'should not err');
    assert.equal(err,null,'should not err');
    cb1 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
}

tests.catcherrWithErrCaught = function() {
  var cb1 = false;
  var cb2 = false;
  var fn0 = function(a,b,c,callback){callback("error!",a+b+c)};
  var errorcallback = function(err,data){
    assert.equal(data, 5, 'should err');
    assert.equal(err,"error!",'should err');    
    cb1 = true;
  };
  var fn1 = x.catcherr(fn0,{errorcallback:errorcallback});
  fn1(0,2,3, function(err,data){
    assert.equal(data, 5, 'should not err');
    assert.equal(err,null,'should not err');
    cb2 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
  assert.equal(cb2, true, 'callbacks must happen');
}


tests.combination = function() {
  var cb1 = false;
  var cb2 = false;
  var d=0;
  var fn0 = function(a,b,c,callback){d++; callback("error",a+b+c+d)};
  var fn1 = x.timeout( fn0,{timeout:500});
  var fn2 = x.catcherr(fn1);
  var fn3 = x.cache(fn2);
  
  fn3(0,2,3, function(err,data){
    assert.equal(data, 6, 'should not err');
    assert.equal(err,null,'should not err');
    cb1 = true;
  });
  fn3(0,2,3, function(err,data){
    assert.equal(data, 6, 'should not err');
    assert.equal(err,null,'should not err');
    cb2 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
  assert.equal(cb2, true, 'callbacks must happen');
  
  setTimeout(function(){
    var cb3 = false;
    fn3(0,2,3, function(err,data){
      assert.equal(data,6,'third call, cached. expected 6. got ' + data);
      cb3 = true;
    })    
    assert.equal(cb3, true, 'callbacks must happen');
  },600)

}

tests.applyfnsLongOpts = function() {
  var cb1 = false;
  var cb2 = false;
  var d=0;
  var fn0 = function(a,b,c,callback){d++; callback("error",a+b+c+d)};
  
  functions = [{function:x.timeout,args:{timeout:500}},
               {function:x.catcherr},
               {function:x.cache}]
  
  var fn3 = x.applyfns(functions, fn0);
  
  fn3(0,2,3, function(err,data){
    assert.equal(data, 6, 'should not err');
    assert.equal(err,null,'should not err');
    cb1 = true;
  });
  fn3(0,2,3, function(err,data){
    assert.equal(data, 6, 'should not err');
    assert.equal(err,null,'should not err');
    cb2 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
  assert.equal(cb2, true, 'callbacks must happen');
  
  setTimeout(function(){
    var cb3 = false;
    fn3(0,2,3, function(err,data){
      assert.equal(data,6,'third call, not cached. expected 6. got ' + data);
      cb3 = true;
    })    
    assert.equal(cb3, true, 'callbacks must happen');
  },600)

}

tests.applyfnsShortOpts = function() {
  var cb1 = false;
  var cb2 = false;
  var d=0;
  var fn0 = function(a,b,c,callback){d++; callback("error",a+b+c+d)};
  
  functions = [{timeout:{timeout:1000}},   //1 secs
             {catcherr:null},
             {cache:{timetostale:1000}}] //1 secs
  
  var fn3 = x.applyfns(functions, fn0);
  
  fn3(0,2,3, function(err,data){
    assert.equal(data, 6, 'should not err');
    assert.equal(err,null,'should not err');
    cb1 = true;
  });
  fn3(0,2,3, function(err,data){
    assert.equal(data, 6, 'should not err');
    assert.equal(err,null,'should not err');
    cb2 = true;
  });
  assert.equal(cb1, true, 'callbacks must happen');
  assert.equal(cb2, true, 'callbacks must happen');
  
  setTimeout(function(){
    var cb3 = false;
    fn3(0,2,3, function(err,data){
      assert.equal(data,6,'third call, not cached. expected 6. got ' + data);
      cb3 = true;
    })    
    assert.equal(cb3, true, 'callbacks must happen');
  },600)

}

tests.applyfnsLongOptsMoreArgs = function() {
  var cb1 = false;
  var cb2 = false;
  var d=0;
  var fn0 = function(a,b,c,callback){d++; callback("error",a+b+c+d)};
  
  var add = function(a,b){return a+b};
  functions = [{function:add,args:1}, 
             {function:add,args:2},
             {function:add,args:3}] //1 secs
  
  var res = x.applyfns(functions, 1);
  
  assert.equal(res, 7, 'should not err');
}

tests.applyfnsShortOptsMoreArgsFns = function() {
  var cb1 = false;
  var cb2 = false;
  var d=0;
  var fn0 = function(a,b,c,callback){d++; callback("error",a+b+c+d)};
  
  var fns = {};
  fns.add = function(a,b){return a+b};
  fns.sub = function(a,b){return a-b};
  fns.multdiv = function(a,b,c){return a*b/c};
  functions = [{add:1}, 
               {sub:2},
               {multdiv:[3,2]}] //1 secs
  
  var res = x.applyfns(functions, 3, fns); // (((3 + 1) - 2) * 3 / 2) = 3
  
  assert.equal(res, 3, 'should not err. expected 3 got ' + res); 
}

for ( var test in tests) {
  console.log('Running ' + test);
  tests[test]();
}