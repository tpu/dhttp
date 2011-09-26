// HTTP Dunamic Server for nodejs version 0.01
var http  = require('http');
var https = require('https');
var fs    = require('fs');
var url   = require('url');
var query = require('querystring');
var j2h   = require('./j2h/j2h').j2h;
var path  = require('path');
var util  = require('util');
var events= require('events').EventEmitter, event = new events(), run = new events();

 var mime = {
     html: 'text/html',
     htm:  'text/html',
     txt:  'text/plain', 
     php:  'text/html',
     css:  'text/css',
     js:   'application/javascript',
     jpeg: 'image/jpeg',
     jpg:  'image/jpeg',
     png:  'image/png',
     gif:  'image/gif',
     bmp:  'image/bmp',
     swf:  'application/x-shokwave-flash',
     flv:  'application/x-shokwave-flash',
     ico:  'image/x-icon',
 } 

 var binary = {
     jpeg: '.jpeg',
     jpg:  '.jpg',
     png:  '.png',
     gif:  '.gif',
     bmp:  '.bmp',
     swf:  '.swf',
     flv:  '.flv',
     ico:  '.ico',
 }

 var httpCode = {
     ok: 200,
     notFound: 404,
 }

 var setContext = function(){ return this } 
 setContext.prototype =  {
     $get: {},
     $var: {},
     $cookie: {},
     $header: {},
     $setHeader: {},
     $console: console.log,  
 }

var getMime = function(fname){
  for(var e in mime){
   if('.'+e == path.extname(fname))return mime[e];
  }
return false;
}

var isBinary = function(fname){
 for(var e in binary){
  if(binary[e] == path.extname(fname)) return true;
 }
return false;   
}

var noRunFiles = function(croot, noRun, fname){
  for(var i = 0; i < noRun.length; i++){
   if(croot+'/'+noRun[i] == fname) return true;
   if(path.basename(croot+'/'+noRun[i]) == '*' && path.dirname(croot+'/'+noRun[i]) == path.dirname(fname)) return true;
 }
return false;
}

var objConcat = function(first, slave){
  for( e in slave){
   first[e] = slave[e]; 
 }
}


exports.dhttp = {
  createServer: function(config, userObject, callback){
   if((config.port == undefined) || (config.root == undefined) || (config.index == undefined))
   {console.log('one or more configuration variables is not defined'); return false;}

//create http or https server
var server = null;   
  switch(config.type){
    case 'https': if(config.https == undefined) return false; 
             var sslopt = { 
                           key: fs.readFileSync(config.https.key),
                           cert: fs.readFileSync(config.https.cert),
                          }
             objConcat(config.https, sslopt);
             server = https.createServer(config.https); break;
    default: server = http.createServer(); break;          
  }

function render(req,res){
 var context = new setContext();
    objConcat(context, userObject);
    context.$get = url.parse(req.url,true).query ;
    context.$cookie = query.parse(req.headers.cookie, '; ') != undefined ? query.parse(req.headers.cookie, '; ') : {} ;
    
      //find request url on server 
       path.exists(config.root+url.parse(req.url).pathname, function(exist){
	
         //request url not found
          if(!exist || noRunFiles(config.root, config.noRun, config.root+url.parse(req.url).pathname )){
	   if(config.errFile != undefined){//send error file 	  
	        context.$setHeader['content-type'] = getMime(config.root + config.errFile);
                j2h.init(config.root+'/'+config.errFile);
		j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
		 res.writeHead(httpCode.ok, context.$setHeader);
		 res.write(data);
		 res.end();
                 delete context;
		});
	   }
	    else{//send 404 not found
	      res.writeHead( httpCode.notFound );
		  res.end();
                  delete context;
	    }
         	  delete context;
		}

	  }
	 //request url is found
           else{
	    fs.stat(config.root+url.parse(req.url).pathname, function(err, stats){
             if(stats.isDirectory()){
		  if(path.existsSync(config.root + url.parse(req.url).pathname + config.index)){
		   if(!isBinary(config.root + url.parse(req.url).pathname + config.index)){
                   context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname + config.index);
                   j2h.init(config.root+url.parse(req.url).pathname + config.index );
		   j2h.run(config.showErr != undefined ? config.showErr : true, context,function(err,data){
		    res.writeHead( httpCode.ok, context.$setHeader);
                    res.write(data);
                    res.end();
                    delete context;
                   });
                   }//end if isBinary
                  }//end if exists
                  else{
                   if(config.errFile != undefined){//send error file 	  
	           context.$setHeader['content-type'] = getMime(config.root + config.errFile);
                   j2h.init(config.root+'/'+config.errFile);
		   j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
		    res.writeHead(httpCode.ok, context.$setHeader);
		    res.write(data);
		    res.end();
                    delete context;
		   });
	          }
	          else{//send 404 not found
	           res.writeHead( httpCode.notFound );
		   res.end();
                  delete context;
	         }
                }//end else exist
	     }//end if isDir
            if(stats.isFile()){
                  if(!isBinary(config.root + url.parse(req.url).pathname)){
                   context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname) ? 
                   getMime(config.root+url.parse(req.url).pathname) : 'text/plain';
                   j2h.init(config.root+url.parse(req.url).pathname );
		   j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
		    res.writeHead( httpCode.ok, context.$setHeader);
                    res.write(data);
                    res.end();
                    delete context;

                  });

                   });

                   }//end if isBinary
                   if(isBinary(config.root + url.parse(req.url).pathname)){
                    context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname);
                    res.writeHead(httpCode.ok, context.$setHeader);

                    var pipe = fs.createReadStream(config.root + url.parse(req.url).pathname);
                    pipe.on('data', function(data){
                     res.write(data);
                     res.end();
                    });
                   fs.createReadStream(config.root + url.parse(req.url).pathname).pipe(res);
                  delete context;
                   }//end if isBinary
            }//end if isFile
	   });//end fs stats
	  }//end else
          });//end exists
         }//end runner
 
if(callback != undefined ) event.on('userfunc', callback);
run.on('run', render);   

server.on('request', function(req,res){
  event.emit('userfunc',url.parse(req.url,true).query, url.parse(req.url).pathname, req, res, run);
 });//end request 
 server.listen(config.port); return true; 
},//end createServer
    
}//end dhttp
