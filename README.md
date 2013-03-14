functional-extras
=================

Functional extras to water your Node.js project.


bindpartial
===========

bp = bindpartial(object,function,*args)

bindpartial is so named because it binds a function to an object and 
partially applies it. This is best explained some examples:


'''js	
	x = require('extras');

    function A(x){this.x = x};
    A.prototype.fn = function(p, q, r){return "" + this.x + p + q + r};
    var a = new A(1);

    a.fn(2, 3, 4)                   // 1234, normal application
	x.bindpartial(a, a.fn)(2, 3, 4)   // 1234, effectively just binds
	x.bindpartial(a, a.fn, 2)(3, 4)   // 1234, partially applied
	x.bindpartial(a, a.fn, 2, 3)(4)   // 1234, partially applied
	x.bindpartial(a, a.fn, 2, 3, 4)() // 1234, completely applied 
    x.bindpartial(a, 'fn', 2, 3)(4)   // 1234, named function if you prefer not to repate the "a"
    x.bindpartial(a, 'fn', 2, undefined, 4)(3)   // 1234, using undefined as a placeholder for an argumemnt
    x.bindpartial(a, 'fn', undefined, 3, undefined)(2,4)   // 1234, again, using undefined as a placeholder for an argumemnt
 
Of cource this isn't much use in itself but it can be handy to create new
function out of existing ones

    joinmylist = bindpartial([1,2,3],'join');
    joinmylist("-");
    joinmylist(",");
    joinmylist(";");



   pf = require('partial-functions');

   pf.bind(a, 'fn').partial(2, 3)(4); 


cachereturns
============

cr = cachereturns(object,function,*args)


cachecallback
=============

ccb = cachecallback(object,function,*args, callback)



Callbacks and Actions
---------------------

First to define some coventions. A callback is a function as follows:

    callback = function(err, data){...}
    
Where err is only set if something goes wrong. And action is a function 
that takes a callback as an argument, i.e.:

    action = function(callback){...}
    
    
To give a concreete example. Try this:

   function nowStandard(){return new Date()};
   console.log(nowStandard());
   console.log('Done');
   
   > Done
   > Wed, 19 Dec 2012 19:40:45 GMT
   
With the callback / action patern it would look like this:
   
   function nowAction(callback){callback(null,new Date())};   
   function nowCallback(err, data){console.log(data)};
   nowAction(nowCallback);
   console.log('Done');
      
   > Done
   > Wed, 19 Dec 2012 19:41:15 GMT

The same result, so why bother? It's about being non-blocking! Try this:

   function nowAction(callback){setTimeout(function(){callback(null,new Date())},1000)};   
   function nowCallback(err, data){console.log(data)};
   nowAction(nowCallback);
   console.log('Done');

   > Wed, 19 Dec 2012 19:42:05 GMT
   > Done

Take a look at the fantastic async.js library to see much more use of callback and
action functions. Note,  some of the async action functions like 'auto' and 'waterfall' 
look more like this:

    action = function(callback, results){...}
    
Which use useful when multiple action functions are chained togewther and need to share
data that is sent to each callback(null, data).


Callbacks Actions Utilities
---------------------------

Caching
.......

    var cachedvalue = null;
    function cacher(getter){return cachedvalue || cachedvalue = getter()}
    function nowAction(callback){callback(null,new Date())};   
    nowCachedAction = x.cache(nowAction);
    
    function nowCallback(err, data){console.log(data)};
    nowCachedAction(nowCallback);
    setTimeout(function(){nowCachedAction(nowCallback);},1000)
    
    > Wed, 19 Dec 2012 19:43:23 GMT
    > Wed, 19 Dec 2012 19:43:23 GMT


Timout
......

    nowTimoutAction = x.timeout(nowAction);


Timeout + Cache




Caching Strategies
------------------

"Preemptive Cache"
1 Always serve requests from cache 
2 Primitively refresh the cache as a background task (so it never goes stale)

* Pro: Fresh, always serves fresh data because the cache is always kept fresh
* Pro: Fast, always serves from cache, so fast.
* Con: Wasteful? Depending on how this is implemented may involve wastefully 
refreshing the cache in the background, even if no responses is imminent.
 

"Reactive Cache"
1 If the cache is not stale - serve from cache.
2 If the cache is stale - refresh the cache then serve the response.

* Pro: Fresh, always serves fresh
* Pro: Efficient, will only refresh the cache if needs be.
* Pro: Simple to implement
* Con: Slow, if cache is stale responses may be slow while waiting for it to be refreshed


"Catch up Cache"
1 Always serve an initial response from cache.
2 If the cache is stale, update in the background.
3 If the cache was updated, serve a second response with the new data 
(e.g. via a push / socket connection )

* Pro: Fresh (eventually) if a stale response is served a subsequent fresh one is sent.
* Pro: Fast, Always serves an initial fast response.
* Pro: Efficient, will only refresh the cache if needs be.
* Con: More complex to implement.


Fetching Source Data
--------------------

Some adopted definitions:

A "callback function" as one that:
* Takes two arguments
* The first, "err", is populated when these is an error.
* The second, "data", is populated with data.

In pseudo code:

    fn_callback = function(err, data){...};

A "data function" as one that:
* Takes a number of arguments
* Where the last argument is a callback function
* The callback is called with suitable err and data values, depending on the arguments
provided to the data function.

In pseudo code:

    fn_data = function(arg1 ... argN, fn_callback){...};

A concrete example:

    var add = function add(arg1, arg2, callback){callback(null, arg1 + arg2)};
    var log = function log(err,data){console.log('data:', data, 'err:', err)};
		add(1,2,log);
		=> data: 3 err: null
		

In the real word data functions will be more complicated that this add example. They might return 
errors, pull data from another server, take a long time, never call their callback, etc. Extras 
helps you handle these scenarios.

1. Timeout

Timeouts are useful if the data function takes too long or in some scenarios may never call it's 
callback. They can be done like this:

    var x = require('extras');
    
		var fn0 = add;
    var options = {};
    options.timeout = 1000; //required. timeout in milliseconds    
    var fn1 = x.timeout(fn0, options);
    fn1(1,2,log);
		=> data: 3 err: null
    
    var fn0b = function dud(){};
    var fn1b = x.timeout(fn0b, options);
    fn1b(1,2,log);
		=> data: null err: Timed Out (after a 1 second timeout)		

fn1 takes the same parameters as fn0 but is guaranteed to return. If fn1 dosn't call it's callback
after the timeout expires it will get called with the err argument set to "Timed Out". e.g.:

    callback("Timed Out", null);
    
2. Catch Errors

Sometimes you want to intercept errors, before they reach the callback. Like this:

    var options = {};
    options.errorcallback = function(err,data){console.log('err caught:',err)};  //optional. A callback that will receive err and data
    options.remove = true; //optional. default is true meaning the error will be removed. i.e. not passed to the main callback, only to the errorcallback. 
    var fn2 = x.catcherr(fn1b, options);
    fn2(1,2,log);
    
fn2 takes the same parameters as fn1 but will always call the callback with err set to null. If
an errcallback function is provided it will receive both the err and the data arguments. This is
useful in combination with the timeout function, to trap a "Timed Out" error.


Step 3. Cache

    var options = {};
    options.timetostale = 60000;   //optional number. Default 60000. Time before the cache goes stale and needs to be refreshed.
    options.cacheprovider = null;  //optional class. Default new BasicCacheProvider(timetostale).
    options.cachename = '';        //optional string. A prefix for items stored in the cache.
    options.servestaleonerr = true //optional boolean. If the function calls back with an error, should a stale copy of the data be served from the cache?

    options.errcallback = function(err,data){}  //optional. A callback that will receive err and data
    var fn3 = cache(options, fn2)
    
Where options defined a cache strategy, made up of:
* set(value)   => null (assumed success)
* get()        => value
* stale()      => true / false

Putting this together:

    fn = getSourceData; //a function of (callback)
    fn = timeout(options_t, fn)
    fn = catcherr(options_e, fn)
    fn = cache(options_c, fn)
    
    //fn is still a function of (callback)
    
    
But, in the real world there is often some preparation to do first. 
getSourceData may take options. You could partially execute it to create
a function suitable for timeout a catcherr, e.g.:

 	  fn = getSourceData //a function of (options, callback)
 	  fn = bindpartial(null, getSourceData, options_s)
 	  fn = timeout(options_t, fn)
    fn = catcherr(options_e, fn)
    
    //fn is now a function of (callback)
    
but passing this to cache is likely to cause a problem. If the getSource data function
takes options, presumably it could return different source data if the options change.
caching the function for one set of options may not cache a result suitable for a different
set of options.

Moreover, you may not have the options to hand at the time you want to wrap your
getSourceData function with timeout, catcherr and cache functionality.

What you really need is:

    fn = getSourceData //a function of (options, callback)
 	  fn = timeout(options_t, fn)
    fn = catcherr(options_e, fn)
    fn = cache(options_c, fn)
    
    //fn is now a function of (options, callback)...
    
Obviously we could take this further and allow fn to have any number of arguments.


geared(tasks, [callback])
-----------------------



__Arguments__

* tasks - 
* callback(err, results) - 