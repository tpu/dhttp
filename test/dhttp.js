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
//var zlib = require('zlib');
var events= require('events').EventEmitter, usrfnc = new events();

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
	 zip: 'multipart/x-zip',
	 rar: 'application/x-rar',
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
	 zip: '.zip',
	 rar: 'rar',
 }

 var httpCode = {
     ok: 200,
     notFound: 404,
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

var render = function(config , context, req, res, file ){
    //setContext;
    context.$get = url.parse( req.url, true ).query ;
    context.$cookie = query.parse(req.headers.cookie, '; ') != undefined ? query.parse(req.headers.cookie, '; ') : {} ;
    context.$var = {};
    context.$header = {};
    context.$setHeader = {};
	context.$console = console.log;
	
  if( file !== undefined ){
   context.$setHeader['content-type'] = getMime( file );
	try{
		j2h.init( file );
	    j2h.run(config.showErr != undefined ? config.showErr : true, context, function( err, data ){
		       res.writeHead( httpCode.ok, context.$setHeader );
		       if( isBinary( file ) ){
			     fs.createReadStream( file ).pipe( res );
                   delete context;
			   }
			   else{
			   res.end( data );
		          delete context;
			  }	  
		});
	}catch( e ){ console.log( e ) }
	return;
  }
   
   //find request url on the server 
    fs.exists(config.root+url.parse(req.url).pathname, function(exist){
	//request url not found
     if(!exist || noRunFiles(config.root, config.noRun, config.root+url.parse(req.url).pathname )){
	   if(config.errFile != undefined){//send error file 	  
	        context.$setHeader['content-type'] = getMime(config.root + config.errFile);
              j2h.init(config.root+'/'+config.errFile);
		      j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
		       res.writeHead(httpCode.ok, context.$setHeader);
		       res.end(data);
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
		   if(fs.existsSync(config.root + url.parse(req.url).pathname + config.index)){
		    if(!isBinary(config.root + url.parse(req.url).pathname + config.index)){
                context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname + config.index);
                j2h.init(config.root+url.parse(req.url).pathname + config.index );
		        j2h.run(config.showErr != undefined ? config.showErr : true, context,function(err,data){
		         res.writeHead( httpCode.ok, context.$setHeader);
                 res.end(data);
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
					  res.end(data);
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
                   context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname) ? getMime(config.root+url.parse(req.url).pathname) : 'text/plain';
                   //context.$setHeader['content-encoding'] = 'gzip';
				   j2h.init(config.root+url.parse(req.url).pathname );
		           j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
		            res.writeHead( httpCode.ok, context.$setHeader);
					res.end(data);
                        delete context;
                  });
                }//end if isBinary
                if(isBinary(config.root + url.parse(req.url).pathname)){
                    context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname);
                    res.writeHead(httpCode.ok, context.$setHeader);
                    fs.createReadStream(config.root + url.parse(req.url).pathname).pipe( res );
                       delete context;
                   }//end if isBinary
            }//end if isFile
	   });//end fs stats
	  }//end else
    });//end exists
}//end render

var success = false;
var server = null; 
var wsMagic = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
var wshash = '';
var wsHandShake = '';
var secKey = '';

exports.dhttp = {
 createServer: function(config, context, callback){
   if((config.port == undefined) || (config.root == undefined) || (config.index == undefined))
     { console.log('one or more configuration variables is not defined'); return false; }

//create http or https server
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

usrfnc.on('userFunction', callback); 
  
server.on('request', function( req, res ){
success = false; 
var app = { 
 request: req,
 response: res, 
 get: function( find, type, call ){
  if( !success ){ 
    if( type === 'q'  && callback.arguments[0] !== undefined ){
       for( key in callback.arguments[0] ){
	     if( find.test( key ) ) 
	   	  {  success = true; call(); } 
	   }		
    }
    if( type === 'p'  && callback.arguments[1] !== undefined ){
       if( find.test( callback.arguments[1] ) ) 
		  {  success = true; call(); }
    }
  }  
}, 

write: function( file ){
    render( config, context, this.request, this.response, file );
  } 
};
  
  usrfnc.emit('userFunction', url.parse(req.url,true).query, url.parse(req.url).pathname, req, res, app );
});//end request   

//WebSockets server|-------------------------------------------------------------------------------|
if(config.wsconfig !== undefined ){
 server.on('upgrade', function(req, ws, sign){
 success = false; 
 var app = { 
 request: req,
 response: ws, 
 get: function( find, type, call ){
  if( !success ){ 
    if( type === 'q'  && callback.arguments[0] !== undefined ){
       for( key in callback.arguments[0] ){
	     if( find.test( key ) ) 
	   	  {  success = true; call(); } 
	}		
  }
     if( type === 'p'  && callback.arguments[1] !== undefined ){
        if( find.test( callback.arguments[1] ) ) 
	 	  {  success = true; call(); }
     }
   }  
 }, 
};

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
   usrfnc.emit('userFunction', url.parse(req.url, true).query, url.parse(req.url).pathname, req, ws, app );  
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
	    if( (packet.readUInt8( 0 ) >> 7 ) == 1 ) return true;
		 return false;
	},
	
	isMasked: function( packet ){
	    if( (packet.readUInt8( 1 ) >> 7 ) == 1 ) return true;
	     return false;
	},
	
	getDataLen: function( packet ){
	    if( ( packet.readUInt8( 1 ) ^ 0x80 ) < 126 ) return ( packet.readUInt8( 1 ) ^ 0x80 ) ;
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 126 ) return packet.readUInt16BE( 2 );	
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 127 ) return packet.readDoubleBE( 2 );			
	},
	
	getMaskKey: function(packet){
	  var key = new Buffer(4);
	  	if( ( packet.readUInt8( 1 ) ^ 0x80 ) < 126 ) {  for( var i = 0; i < 4; i++ ) { key[ i ] = packet.readUInt8( i + 2 ); }  return key; }
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 126 ) {  for( var i = 0; i < 4; i++ ) { key[ i ] = packet.readUInt8( i + 4 ); }  return key; }
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 127 ) {  for( var i = 0; i < 4; i++ ) { key[ i ] = packet.readUInt8( i + 10 ); }  return key; }
	},
	
	getData: function( packet ){
	  var len = this.getDataLen( packet );
	  var index = 0;

	    if( this.isMasked( packet )){ 
		if( ( packet.readUInt8( 1 ) ^ 0x80 ) < 126 ) index = 6; 
	    if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 126 ) index = 8
        if( ( packet.readUInt8( 1 ) ^ 0x80 ) == 127 ) index = 14;
	    var key  = this.getMaskKey( packet );
	    var text = new Buffer( len );
	     for( var i = 0; i < len; i++ ){
		     text[ i ] = packet[ i + index ] ^ key[ ( i % 4 ) ]; 
		 }
	  }else{
		if(  packet.readUInt8( 1 ) < 126 ) index = 2; 
	    if(  packet.readUInt8( 1 ) == 126 ) index = 4
        if(  packet.readUInt8( 1 ) == 127 ) index = 10;
        var text = packet.toString('utf8', index );
	   }	  
	 	
	   return text.toString('utf8');; 
	} ,
    
	createHeader: function( fin, opcode, masked ){
      var packet = Buffer(2);
	   packet.writeUInt16BE( 0, 0 );
	   fin ? packet[0] = 0x80 : packet[0]  ; 
	   opcode > 0 ? packet[0] = packet[0] | opcode : packet[0];  
       masked ? packet[1] =  0x80 : packet[1] ;	   
	   return packet;
	},
    
	addData: function(data , fin, opcode, masked){
	  if( typeof data == 'string' ) 
	   var len = Buffer.byteLength(data, 'utf8');
	  else if( Buffer.isBuffer( data ) ){
        var len = data.length;
		opcode == 1 ? data = data.toString('utf8') : data = data.toString('binary');
      }		
	  else throw new Error('data type must be a [ string or Buffer ]'); 
	   var header = this.createHeader( fin, opcode, masked );
	   var packet = null;
	   if( this.isMasked( header ) ){
	    len < 126 ?  packet = Buffer( 2 + 4 + len ) : len > 125 && len <= 0xFFFF ? packet = Buffer( 2 + 2 + 4 + len ) :  packet = Buffer( 2 + 8 + 4 + len ) ;
	    packet.writeUInt16BE( header.readUInt16BE( 0 ), 0 );
		
	   }
	   else{ 
	    len < 126 ?  packet = Buffer( 2 + len ) : len > 125 && len <= 0xFFFF ? packet = Buffer( 2 + 2 + len ) :  packet = Buffer( 2 + 8 + len ) ;
	    packet.writeUInt16BE( header.readUInt16BE( 0 ), 0 );
		len < 126 ?  packet[1] = packet[1] | len : len > 125 && len <= 0xFFFF ? packet[1] = packet[1] | 126 : packet[1] = packet[1] | 127 ;
		len < 126 ? len : len > 125 && len <= 0xFFFF ? packet.writeUInt16BE( len, 2 ) :  packet.writeDoubleBE( len, 2)  ;
		len < 126 ?  packet.write(data, 2, len) : len > 125 && len <= 0xFFFF ? packet.write( data, 4, len) : packet.write( data, 10 , len ) ;
	    return packet;
	   }
	 },
     
     ping: function(){
	     return this.createHeader(true, 0x09, false);
	 },	 
	 pong: function(){
	     return this.createHeader(true, 0x0A, false);
	 },

}//end ws
