// HTTP Dunamic Server for nodejs version 0.01
var http  = require('http');
var https = require('https');
var crypto= require('crypto');
var fs    = require('fs');
var url   = require('url');
var query = require('querystring');
var j2h   = require('./j2h/j2h').j2h;
var path  = require('path');
var util  = require('util');
var events= require('events').EventEmitter, usrfnc = new events()//, j2hrun = new events();

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
 createServer: function(config, context, callback){
   if((config.port == undefined) || (config.root == undefined) || (config.index == undefined))
     { console.log('one or more configuration variables is not defined'); return false; }

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
 var newContext = new setContext();

    objConcat(context, newContext);
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
                }//end if isBinary
                if(isBinary(config.root + url.parse(req.url).pathname)){
                    context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname);
                    res.writeHead(httpCode.ok, context.$setHeader);
                    var pipe = fs.createReadStream(config.root + url.parse(req.url).pathname);
                    pipe.on('data', function(data){
                      res.write(data);
                      res.end();
                    });
                    delete context;
                   }//end if isBinary
            }//end if isFile
	   });//end fs stats
	  }//end else
    });//end exists
}//end render
 
if(callback != undefined ) 
usrfnc.on('userFunction', callback);

var called = 0;

var zerof = function(){
  return;
}

var tmpl = function(){
   render( callback.arguments[2], callback.arguments[3] );
} 

var get = function( find, type, call ){
   if( type == 'q' ){
      if( callback.arguments[0][find] !== undefined && called == 0 ){ called = 1; call();  }
   }
   if( type == 'p' ){
     if( callback.arguments[1].match( find )  !== null && called == 0 ){ called = 1; call(); }
   }
   return;
}

server.on('request', function(req,res){
  called = 0 ; 
  usrfnc.emit('userFunction',url.parse(req.url,true).query, url.parse(req.url).pathname, req, res, tmpl, get);
});//end request   

//WebSockets server|-------------------------------------------------------------------------------|
if(config.wsconfig != undefined ){
 var wsMagic = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
 var wshash = '';
 var wsHandShake = '';
 var secKey = '';

 server.on('upgrade', function(req, ws, sign){
 if(req.headers['sec-websocket-version'] != undefined && req.headers['upgrade'] == 'websocket'){
  if(req.headers['sec-websocket-protocol'] != undefined && req.headers['sec-websocket-protocol'] == config.wsconfig.proto){
   if( req.headers['sec-websocket-key'] != undefined ){
   secKey = req.headers['sec-websocket-key']+wsMagic; 
   wshash = crypto.createHash('sha1');
   wshash.update(secKey);
   wsHandShake = 'HTTP/1.1 101 Switching Protocols\r\n'+
                            'Upgrade: websocket\r\n'+
                            'Connection: Upgrade\r\n'+
                            'Sec-WebSocket-Accept: '+wshash.digest('base64')+'\r\n'+
                            'Sec-WebSocket-Protocol: '+config.wsconfig.proto+'\r\n\r\n';
   ws.write(wsHandShake, 'binary');
   usrfnc.emit('userFunction', url.parse(req.url, true).query, url.parse(req.url).pathname, req, ws, zerof, get);  
   }else{ ws.end('error') }
  }else{ ws.end('error') }
 }else{ ws.end('error') }
});//end upgrade 
}//end websockets server
 
 server.listen(config.port); return true; 
},//end createServer
    
}//end dhttp


exports.ws = {
    getDataType: function( packet ){
	    return ( packet.readUInt8( 0 ) & 0xF ); 
	},
	 isEnd: function( packet ){
	    console.log()
	    if( (packet.readUInt8( 0 ) >> 7 ) == 1 ) return true;
		 return false;
	},
	isMasked: function( packet ){
	    if( (packet.readUInt8( 1 ) >> 7 ) == 1 ) return true;
	     return false;
	},
	getDataLen: function( packet ){
	    if( ( packet.readUInt8( 1 ) ^ 0x80 ) < 126 ) return ( packet.readUInt8( 1 ) ^ 0x80 ) ;
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 0x7E ) return packet.readUInt16BE( 2 );	
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 0x7F ) return packet.readDoubleBE( 2 );			
	},
	getMaskKey: function(packet){
	  var key = new Buffer(4);
	  	if( ( packet.readUInt8( 1 ) ^ 0x80 ) < 126 ) {  for( var i = 0; i < 4; i++ ) { key[ i ] = packet.readUInt8( i + 2 ); }  return key; }
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 0x7E ) {  for( var i = 0; i < 4; i++ ) { key[ i ] = packet.readUInt8( i + 4 ); }  return key; }
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 0x7F ) {  for( var i = 0; i < 4; i++ ) { key[ i ] = packet.readUInt8( i + 10 ); }  return key; }
	},
	getTextData: function( packet ){
	  var len = this.getDataLen( packet );
	  var key  = this.getMaskKey( packet );
	  var index = 0;
	  if( ( packet.readUInt8( 1 ) ^ 0x80 ) < 126 ) index = 6;
      if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 0x7E ) index = 8
      if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 0x7F ) index = 14;
	  var text = new Buffer( len );
	     for( var i = 0; i < len; i++ ){
		     text[ i ] = packet[ i + index ] ^ key[ ( i % 4 ) ]; 
		 }
	   return text; 
	} 	 
	 
}//end ws
