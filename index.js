/**
 * @Author Adam Griffiths
 * @description a few helper functions for functions / a more functional style
 * 
 * Credits:
 * http://ejohn.org/blog/partial-functions-in-javascript/
 */

var _              = require("underscore");
var async          = require("async");

var logger = {
    debug: function(){}
}

var setlogger = exports.setlogger = function(newlogger){
  logger = newlogger;
  logger.debug('log set');
}

var __DEBUG__ = false;


var bindpartial = exports.bindpartial = function bindpartial(self,fn){
  //convert named function to function of self
  if(!(fn instanceof Function)){
    fn = self[fn];
  }
  boundargs = Array.prototype.slice.call(arguments);
  boundargs.shift();
  boundargs.shift();
  return function(){
    var args = boundargs.slice();
    var j = 0;
    //for each of the partial args
    for ( var i = 0; i < args.length && j < arguments.length; i++ )
      if ( args[i] === undefined )
        args[i] = arguments[j++];

    //for any remaining new args    
    for (var i = args.length; j < arguments.length; )
      args[i++] = arguments[j++];

    return fn.apply(self, args);
  };
};


Function.prototype.partial = function(){
  var boundargs = Array.prototype.slice.call(arguments);
  return partialarr(this, boundargs);
}

Function.prototype.partialarr = function(boundargs){
  return partialarr(this, boundargs);
}

var partial = exports.partial = function(fn){
  var boundargs = Array.prototype.slice.call(arguments);
  return partialarr(fn, boundargs);
};

var partialarr = exports.partialarr = function(fn, boundargs){
  if(!Array.isArray(boundargs)){
    if(__DEBUG__) console.trace("boundargs should be an array!");
  }

  var partialfunction = function(){
    var args = boundargs.slice();
    var j = 0;
    //for each of the partial args
    for ( var i = 0; i < args.length && j < arguments.length; i++ )
      if ( args[i] === undefined )
        args[i] = arguments[j++];

    //for any remaining new args    
    for (var i = args.length; j < arguments.length; )
      args[i++] = arguments[j++];

    return fn.apply(this, args);
  };
  //just to be sure to allow partial chaining
  partialfunction.prototype.partial = Function.prototype.partial;
  partialfunction.prototype.partialarr = Function.prototype.partialarr;
  return partialfunction;
};


    
var bind = exports.bind = function(self, fn){
  if(!(fn instanceof Function)){
    fn = self[fn];
  }
  if(fn){
    var boundfunction = function(){
      args = Array.prototype.slice.call(arguments);
      return fn.apply(self, args);    
    }
    return boundfunction;
  }else{
    return null;
  }
}

/** splitOutErr 
 * splitOutErr(callback, errorcallback)
 * var callbackAlways = function(err, results){}; //always gets called, err will always be null;
 * var callbackError  = function(err, results){}; //called only if err has a value
 * var callback = _x.splitOutErr(callbackAlways, callbackError)
 * then do
 * some_function(callback);
 */
var splitOutErr = exports.splitOutErr = function(callback, errorcallback){
  return function(err, results){
    callback(null, results);
    if(err) errorcallback(err, results);
  }
}



/** dependencycheck 
 * dependencycheck(list, dependency_getter) 
 * 
 * Returns a list of keys (if list is and Object) or indexes (if list is and Array)
 * in dependency order or null if there is a circular dependency. 
 * 
 * list - is either an Object[key]->item or an Array[index]->item
 * dependency_getter - is a function(key/index,item) that returns the list of
 * the keys/indexes of dependent items.
 *
 * if dependency_getter is omitted it is assumed to be:
 *
 *     function(key,item){return item};
 * 
 * Examples:
 * 
    var x = require('extras');
 
    x.dependencycheck({a:['b'],b:[],c:['b','a']});
    => [ 'b', 'a', 'c' ] //b must come first because a and c are dependent on it. a must come next because c is dependent on it.

    x.dependencycheck({a:['b'],b:['a']})
    => null //circular 

    var deps = {};
    deps[0] = {requires:[1]};  //the first item in the list requires the second
    deps[1] = {requires:[2]};  //the second item in the list requires the third
    x.dependencycheck(['1','2','3'],function(item,key){return deps[key] ? deps[key].requires: null})
    => [ 2, 1, 0 ]

 */

var dependencycheck = function dependencycheck(list, dependency_getter){
  var normalisedlist
  if(Array.isArray(list)){
    normalisedlist = [];
  }else{
    normalisedlist = {};    
  }
  if(!dependency_getter) dependency_getter = function(item,key){return item};
  var total = 0
  _.each(list, function(item, key, list){
    var deps = dependency_getter(item,key) || [];
    if(! Array.isArray(deps)){
      throw new Error("Expected an aray of dependencies");
    }else{
      normalisedlist[key] = deps
    }
    total++;
  });
  //if(__DEBUG__) console.log(normalisedlist);
  
  var makingprogress = (function(last_todo){
    return function (curr_todo){
      if(curr_todo < last_todo){
        last_todo = curr_todo;
        return true;
      }else{
        return false;
      }
    }
  })(total+1);
  
  var todo_count = total;
  var todo_k2d   = _.extend({},normalisedlist);
  var sortedlist = [];
  //Keep going until all items in the todo list have been
  //handled
  while(todo_count > 0 && makingprogress(todo_count)){
    var leaves_found = [];
    //loop over the normalisedlist
    _.each(todo_k2d, function(d, k, list){
      //and for any items with no dependencies (i.e "leaves")
      if(!d || d.length === 0){
        //remove them from the todo set
        delete todo_k2d[k]
        //push them into the laevs_found list
        leaves_found.push(k);
        //and remove them as dependencies from the other items 
        //i.e. the dependency has been resolved.
        removedependancies(todo_k2d,k);
        todo_count--;
      }
    });
    sortedlist = sortedlist.concat(leaves_found);
  }
  return todo_count > 0 ? null : sortedlist;
}

function removedependancies(k2d,k_toremove){
  _.each(k2d, function(d1, k1, list1){
    var d_new = _.filter(d1, function(k2){return k2 != k_toremove});
    //var d_new = _.extend({},d1);
    //delete d_new[k_toremove];
    k2d[k1] = d_new;
  });
}
exports.dependencycheck = dependencycheck;

/** each_in_dependency_order
 * each_in_dependency_order(list, dependency_getter, iterator, context) Alias eachd1
 * 
 * Iterates though the list in dependency order. Gets the order from  
 * dependencycheck(list, dependency_getter).
 * 
 * Returns true if an iteration happens. False otherwise which could indicate
 * circular dependencies.
 * 
 * Examples:

    var x = require('extras');
 
    var data = {t:{name:'turnip', prefer:['b','c']},b:{name:'beatroot'},c:{name:'carrot', prefer: ['b']}};
    var dependency_getter = function(item,key){ return item.prefer };
    x.dependencycheck(data,dependency_getter);
    => [ 'b', 'c', 't' ]
      
    x.eachd1(data, dependency_getter, function(item,key){
      console.log(item.name);
    });
    => beatroot
     > carrot
     > turnip

 */

var each_in_dependency_order = function each_in_dependency_order(list, dependency_getter, iterator, context){
  var order = dependencycheck(list, dependency_getter);
  if(!order) return false;
  _.each(order, function(list_key,order_key){
    iterator(list[list_key], list_key, list);
  }, context);
  return true;
}

exports.each_in_dependency_order = each_in_dependency_order;
exports.eachd1 = each_in_dependency_order;


/** jsonpath
 * jsonpath(list, data) 
 * 
 * Uses the list of keys to navigate the the data structure
 * and return the value found
 * 
 * 
 * Examples:

    var x = require('extras');
 
    var data = {a:[{b:'hello'}]}
    x.jsonpath(['a',0,'b'],data);
    => hello

    var data = {a:[{b:'hello'}]}
    x.jsonpath(['a',1,'z'],data);
    => null

 */

exports.jsonpath = function(list, data){
  var nextitem = list.shift();
  var nextdata = data[nextitem];
  if(list.length > 0 && nextdata){
    return exports.jsonpath(list, nextdata);
  }else{
    return nextdata;
  }
};

/**
 * Converts an enumerable to an array.
 * Copied from socket.io util
 * @api public
 */
exports.toArray = function (enu) {
  var arr = [];

  for (var i = 0, l = enu.length; i < l; i++)
    arr.push(enu[i]);

  return arr;
};

/**
 * Basic caching
 * @api 
 */
//fn could be fn(callback)
//fn could be fn(callback)
//fn could be fn(a,b,c, callback)
//fn could be fn(a,b,c, callback)

var BasicCacheProvider = exports.BasicCacheProvider = function(timetostale){
  this.cache_value = {};
  this.stale_times = {};
  this.timetostale = timetostale;
} 

BasicCacheProvider.prototype.get = function(key){
  logger.debug('[' + key + '] returned');
  return this.cache_value[key];  
}

BasicCacheProvider.prototype.set = function(key, value){
   var stale_time = new Date();
   stale_time.setMilliseconds(stale_time.getMilliseconds() + this.timetostale);
   this.stale_times[key] = stale_time.valueOf(); 
   this.cache_value[key] = value;  
   logger.debug('[' + key + '] updated. Fresh until: ' + stale_time.toGMTString());
}

BasicCacheProvider.prototype.isstale = function(key){
  return (!this.stale_times[key]) || (new Date().valueOf()) > this.stale_times[key];
}

BasicCacheProvider.prototype.state = function(key){
  if ( !this.stale_times[key] ){
    return 'EMPTY';
  } else if ( this.stale_times[key] < (new Date().valueOf()) ){
    return 'STALE';
  } else {
    return 'FRESH'    
  }
}

/**
 * shiftpushargs
 */

var shiftpushargs = exports.shiftpushargs = function (fn) {
  return function(){
    var args =  Array.prototype.slice.call(arguments);
    args.push(args.shift());
    fn.apply(null, args);
  }
}

/**
 * timeout
 */

var timeout = exports.timeout = function (fn, options) {
  options = options || {};
  var timeout = options.timeout = options.timeout || 10000; //10 seconds
  var name = options.name = options.name || 'unnamed';
  logger.debug('[' + name + '] timeout called');
  
  var timeoutfn  = function(){
    var args =  Array.prototype.slice.call(arguments);
    var callback = args.pop();    
    var finished = false;
    
    var finishSuccess = function(err,data){
      if(!finished){
        finished=true;
        logger.debug('[' + name + '] timeout finishSuccess');            
        callback(err,data);        
      }
    }

    var finishTimeout = function(){
      if(!finished){
        finished=true;
        logger.debug('[' + name + '] timeout finishTimeout');            
        callback("Timed Out", null);        
      }
    }
    
    args.push(finishSuccess);    
    fn.apply(null, args);
    
    setTimeout(finishTimeout, timeout);
  }
  return timeoutfn;
};

/**
 * catcherr
 */

var catcherr = exports.catcherr = function (fn, options) {
  
  options = options || {};
  var errorcallback = options.errorcallback = options.errorcallback || null;
  var successcallback = options.successcallback = options.successcallback || null;
  var alwayscallback = options.alwayscallback = options.alwayscallback || null;
  var remove = options.remove = options.remove || true;
  var name = options.name = options.name || 'unnamed';
  logger.debug('[' + name + '] catcherr called');

  
  var catcherrfn  = function(){
    var args =  Array.prototype.slice.call(arguments);
    var originalcallback = args.pop();    
    var finished = false;
    
    var finishSuccess = function(err, data){
      if(successcallback) successcallback(err, data); 
      if(alwayscallback) alwayscallback(err, data); 
      if(originalcallback) originalcallback(null, data);        
    }

    var finishError = function(err, data){
      if(errorcallback) errorcallback(err, data); 
      if(alwayscallback) alwayscallback(err, data); 
      if(originalcallback){
        if(remove){
          originalcallback(null, data);        
        }else{
          originalcallback(err, data);                
        }
      }
    }
    
    var finish = function(err,data){
      if(err){
        finishError(err, data);
      }else{
        finishSuccess(err, data);
      }
    }
    
    args.push(finish);    
    fn.apply(null, args);
  }
  return catcherrfn;
};

/**
 * cache
 */

var defaultcacheproviders = {};


var cache = exports.cache = function (fn, options) { 

  options = options || {};
  var timetostale = options.timetostale = options.timetostale || 120000; //2 mins
  if(!options.cacheprovider){
    defaultcacheproviders[timetostale] = defaultcacheproviders[timetostale] || new BasicCacheProvider(timetostale);
  }
  var cp = options.cacheprovider = options.cacheprovider || defaultcacheproviders[timetostale];
  var servestale = options.servestale || true;
  var servestaleonerr = options.servestaleonerr || true;
  var name = options.name = options.name || 'unnamed';
  logger.debug('[' + name + '] cache called');
  
  var cachedfn = function(){ //n arguments, asssume the last is the callback 
    logger.debug('[' + name + '] cache inside caching wrapper');
    var args =  Array.prototype.slice.call(arguments);
    var callback = args.pop();    
    var cachekey = name + ':' + args.join(':');

    var finishSuccess  = function(data){      
      callback(null, data);
    }

    var finishFail  = function(err,data){
      callback(err,data);
    }

    var recache = function(err,data){
      logger.debug('[' + cachekey + '] cache recaching');
      if(!err){
        cp.set(cachekey, data);          
      }      
    }
    var finishAndRecache = function(err, data){
      recache(err, data);
      callback(err, data);
    }
    
    var cachestate = cp.state(cachekey);    
    logger.debug('[' + cachekey + '] cache state: ' + cachestate);
    
    if(cachestate === 'FRESH' || (cachestate === 'STALE' && servestale)){
      logger.debug('[' + cachekey + '] cache getting from cache');
      finishSuccess(cp.get(cachekey));
    }else 
    if(cachestate === 'EMPTY' || (cachestate === 'STALE' && !servestale)){
      logger.debug('[' + cachekey + '] cache getting from source and recaching');
      args.push(finishAndRecache);
      fn.apply(null, args);      
    }
    if(cachestate === 'STALE' && servestale){      
      logger.debug('[' + cachekey + '] cache recaching from source');
      args.push(recache);
      fn.apply(null, args);             
    }
  }
  return cachedfn;
  logger.debug('[' + name + '] cache returning wrapping fn');
}


/**
 * queuecallbacks
 */

var queueedcallbacks = {};

var queuecallbacks = exports.queuecallbacks = function (fn, options) {  
  options = options || {};
  var name = options.name;
  if(!name) throw Error("queuecallbacks needs a name!");
  logger.debug('[' + name + '] queuecallbacks called');
  
  var newfn = function(){    
    var args =  Array.prototype.slice.call(arguments);
    var callback = args.pop();    
    var queuekey = name + ':' + args.join(':');
    
    queueedcallbacks[queuekey] = queueedcallbacks[queuekey] || [];
    queueedcallbacks[queuekey].push(callback);
    var len = queueedcallbacks[queuekey].length;
    
    logger.debug("[" + queuekey + "] queuecallbacks waiting callbacks: " + len);            
    if(len === 1){
      callbackall = function(err, data){  
        logger.debug("[" + queuekey + "] queuecallbacks function returned");            
        var callbacka;
        while(callbacka = queueedcallbacks[queuekey].pop()){
          callbacka(err, data);
          var len = queueedcallbacks[queuekey].length;
          logger.debug("[" + queuekey + "] queuecallbacks callback made. Waiting callbacks: " + len);            
        }
      }
      logger.debug("[" + queuekey + "] queuecallbacks function called");
      fn(callbackall); //thread will cease to block at this stage and move to work on the next request
    }
  }
  return newfn;
}

 

//(fn_defs, intialargs,  functionsources )
//or (fn_defs, intialargs)
var __DEBUG__AF__ = true;
var applyfns = exports.applyfns = function (fn_defs, intialargs,  functionsources ) {
  //var args = Array.prototype.slice.call(arguments);
  var fn_defs         = ensurearray(fn_defs);
  var intialargs      = ensurearray(intialargs);
  var functionsources = functionsources || exports;
  
  var previousresult = intialargs;
  var i = 1;
  _.each(fn_defs,function(fn_def){
    if(!fn_def.function){
      fn_def.function = Object.keys(fn_def)[0];
      fn_def.args  = fn_def[fn_def.function];
    }
    fn = fn_def.function;
    if(typeof fn === 'string'){
      fn_def.functionname = fn;
      fn = functionsources[fn];              
    }else{
      fn_def.functionname = 'a reference';
      fn = fn;
    }
    if(! (typeof fn === 'function')){
      if(__DEBUG__AF__) console.error("Error fn is not a function ", fn);      
    }
    var extraargs = ensurearray(fn_def.args);
    var args = previousresult.concat(extraargs);
    if(__DEBUG__AF__) console.log("function","'" + fn_def.functionname + "'"," with args", args);
    previousresult = [fn.apply(null, args)];
    if(__DEBUG__AF__) console.log("  =>", previousresult);
  });
  return previousresult[0];
}

var ensurearray = exports.ensurearray = function (arg) {
  if(arg === null || arg === undefined){
    return [];
  }else if(Array.isArray(arg)){  
    return arg.slice();
  }else{
    return [arg];
  }
}

var Funcspec = exports.Funcspec = function(func){
  if (!(this instanceof Funcspec)){
    return new Funcspec(func);
  };
  //console.log(func);
  this.func = func;
  return this;
}

//Call is synonymous with Funcspec
var Call = exports.Call = Funcspec;

Funcspec.prototype.withargs = function(){
  this.args = Array.prototype.slice.call(arguments);
  return this;
}

Funcspec.prototype.resultin = function(result){
  this.result = result;
  return this;
}


/*

fns = 
  [
  Call(fn).withargs(1,2).resultin('a'),
  Call(fn).withargs('a','b').resultin('b'),
  {func:fn, args:['a','b'], result:'b'}
  ]
*/
var geared = exports.geared = function(funcspecs, callback){
  if(!Array.isArray(funcspecs )){
    funcspecs = Array.prototype.slice.call(arguments);
    callback = funcspecs.pop();
  }
  var context = {};  
  var tasks = comipleforasyncauto(funcspecs, context);
  async.auto(tasks, function(err, data){
    callback(err, context);
  });
}


var comipleforasyncauto = exports.comipleforasyncauto = function(funcspecs, context){
  var autoinput = {}
  var resultstosteps = {}
  var step = 0;
  funcspecs.forEach(function(funcspec){
    funcspec.func =  funcspec.func || funcspec;
    step++;
    if(funcspec.result){
      if(! resultstosteps[funcspec.result]){
        resultstosteps[funcspec.result] = [];
      }
      resultstosteps[funcspec.result].push(step);
    }
    var todo = [];
    todo.push(wrapFnForAsyncAuto(funcspec.func, funcspec.args, funcspec.result || '_' + step, context));
    if(funcspec.args){
      funcspec.args.forEach(function(arg){
        var steps =  resultstosteps[arg];
        steps.forEach(function(step){
          todo.unshift(step); 
        })
      })
    }
    autoinput[step] = todo;
  })
  return autoinput;
}

function contextKeeper(result, context, callback){
  return function(err, data){
    if(result){
      context[result] = data;
    }
    callback(err, data);
  }
}

function wrapFnForAsyncAuto(func, args, result, context){
  return function(callback, results){
    newargs = [];
    if(args){
      args.forEach(function(arg){
        newargs.push(context[arg]);
      })
    }
    newargs.push(contextKeeper(result, context, callback));
    func.apply(null,newargs);
  }
}