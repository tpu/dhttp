// HTTP Dunamic Server for nodejs version 1.0
var http  = require('http');
var https = require('https');
var crypto= require('crypto');
var fs    = require('fs');
var url   = require('url');
var query = require('querystring');
var j2h   = require('./j2h/j2h').j2h;
var path  = require('path');
var util  = require('util');
var zlib = require('zlib');
var domain = require('domain');
var events = require('events').EventEmitter;

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
	nf: 404,
	ie: 500,
 }
 
 var usrfnc = new events();
 var arrCache = [ ]; 
 var deb = console.log;
 var server = null; 
 var wsMagic = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
 var wsHash = '';
 var wsHandShake = '';
 var wsSecKey = '';
 
 var isBinary = function(fname){
   for(var e in binary){
    if( binary[e] == path.extname(fname) ) return true;
    }
   return false;   
 }

 var noRunFiles = function(croot, noRun, fname){
    for( var i = 0; i < noRun.length; i++ ){
     if( croot+'/'+noRun[i] == fname ) return true;
     if( path.basename(croot+'/'+noRun[i] ) == '*' && path.dirname( croot+'/'+noRun[i]) == path.dirname(fname) ) return true;
    }
   return false;
 }

 var getMime = function(fname){
   for(var e in mime){
    if( '.'+e == path.extname(fname) ) return mime[e];
   }
   return false;
 }

//Template renderer |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|	
 var render = function(config , context, req, res, file ){
	//setContext;
     context.$get = url.parse( req.url, true ).query ;
     context.$cookie = query.parse(req.headers.cookie, '; ') != undefined ? query.parse(req.headers.cookie, '; ') : {} ;
     context.$var = {};
     context.$header = req.headers;
     context.$setHeader = {};
	 context.$console = console.log;
	 
	 try{
        if( file ){
		    if( isBinary( file ) ){
			    context.$setHeader['content-type'] = getMime( file );
			    res.writeHead( httpCode.ok, context.$setHeader );
			    fs.createReadStream( file ).pipe( res );
                   delete context; return;
			  }
			  else{
			    j2h.init( file );
	            j2h.run(config.showErr != undefined ? config.showErr : true, context, function( err, data ){
                  if( err ) throw err;  
					if( config.encode ){ 
				       if( req.headers['accept-encoding']  && req.headers['accept-encoding'].indexOf( 'gzip' ) >= 0 ){
						context.$setHeader['content-encoding'] = 'gzip'; 
					    context.$setHeader['content-type'] = getMime( file );
					      res.writeHead( httpCode.ok, context.$setHeader);
						   zlib.gzip(data, function(err, gdata){
				            if( err ) throw err;
							 res.end( gdata, config.charset ? config.charset : 'utf8' );
                           }); 
						  delete context; return; 
						}
					   if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'deflate' ) >= 0 ){
					    context.$setHeader['content-encoding'] = 'deflate'; 
					    context.$setHeader['content-type'] = getMime( file );
					     res.writeHead( httpCode.ok, context.$setHeader);
						  zlib.deflate(data, function(err, gdata){
				           if( err ) throw err;
						    res.end( gdata, config.charset ? config.charset : 'utf8' );
                          });
					      delete context; return;
						}
					} 
					context.$setHeader['content-type'] = getMime( file );
					res.writeHead( httpCode.ok, context.$setHeader );
					res.end( data, config.charset ? config.charset : 'utf8'  );  
					    delete context; return; 
                });			 
			 }	
        }
	 }catch( e ){
		  if( res.writable ){
	        res.writeHead( httpCode.ie );
            res.end( '500 Internal Server Error' )
          }
            console.log( e ); return;
	 }
   
   //find request url on the server 
     fs.exists(config.root+url.parse(req.url).pathname, function( exist ){
	//request url not found
        if(!exist || noRunFiles(config.root, config.noRun, config.root+url.parse(req.url).pathname )){
	      if(config.errFile != undefined){//send error file 	  
              j2h.init(config.root+'/'+config.errFile);
		      j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
                  if( err ) throw err;
					if( config.encode ){ 
				       if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'gzip' ) >= 0 ){
						context.$setHeader['content-encoding'] = 'gzip';
					    context.$setHeader['content-type'] = getMime( config.root+ '/' + config.errFile );
					      res.writeHead( httpCode.ok, context.$setHeader);
						   zlib.gzip(data, function(err, gdata){
				             if( err ) throw err;
							 res.end( gdata, config.charset ? config.charset : 'utf8' );
                           });
						  delete context; return; 
						}  
					   if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'deflate' ) >= 0 ){
					    context.$setHeader['content-encoding'] = 'deflate';
					    context.$setHeader['content-type'] = getMime( config.root+ '/' + config.errFile );
					     res.writeHead( httpCode.ok, context.$setHeader);
						   zlib.deflate(data, function(err, gdata){
				             if( err ) throw err;
						     res.end( gdata, config.charset ? config.charset : 'utf8' );
                           });
					      delete context; return;
						}
					}
					context.$setHeader['content-type'] = getMime( config.root+ '/' + config.errFile );
					res.writeHead( httpCode.ok, context.$setHeader);
					res.end( data, config.charset ? config.charset : 'utf8'  );  
					    delete context; return; 
		      });
	        }
	        else{//send 404 not found
		        res.writeHead( httpCode.nf );
		        res.end();
                 delete context; return;
		    } 
	    }
	      //request url is found
            else{
	        fs.stat(config.root+url.parse(req.url).pathname, function(err, stats){
            if( err ) throw err;
			 if( stats.isDirectory() ){
		      if( fs.existsSync( config.root + url.parse(req.url).pathname + config.index ) ){
		       if( !isBinary(config.root + url.parse(req.url).pathname + config.index ) ){
				 j2h.init( config.root+url.parse(req.url).pathname + config.index );
		         j2h.run( config.showErr != undefined ? config.showErr : true, context, function( err, data ){
		          if( err ) throw err;
					if( config.encode ){
				       if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'gzip' ) >= 0 ){
						context.$setHeader['Content-Encoding'] = 'gzip';
					    context.$setHeader['Content-Type'] = getMime(config.root+url.parse(req.url).pathname + config.index);
					      res.writeHead( httpCode.ok, context.$setHeader );
						  zlib.gzip(data, function(err, gdata){
				             if( err ) throw err;
							 res.socket.setNoDelay( true );
    						 res.end( gdata, config.charset ? config.charset : 'utf8' );
                             
						   });
						  delete context; return; 
						}  
					   if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'deflate' ) >= 0){
					    context.$setHeader['content-encoding'] = 'deflate';
					    context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname + config.index);
					     res.writeHead( httpCode.ok, context.$setHeader);
						  zlib.deflate(data, function(err, gdata){
				             if( err ) throw err;
							 res.end( gdata, config.charset ? config.charset : 'utf8' );
                          });
					      delete context; return;
						}
					}
					context.$setHeader['content-type'] = getMime(config.root+url.parse(req.url).pathname + config.index);
					res.writeHead( httpCode.ok, context.$setHeader );
					res.socket.setNoDelay( false );
					res.end( data, config.charset ? config.charset : 'utf8'  );      
						 delete context; return; 
				});
             }//end if not Binary index file
            }//end if exists
            else{
                 if(config.errFile != undefined){//send error file 	  
     				j2h.init(config.root+'/'+config.errFile);
		            j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
		             if( err ) throw err;
					  if( config.encode ){ 
				        if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'gzip' ) >= 0 ){
						 context.$setHeader['content-encoding'] = 'gzip';
					     context.$setHeader['content-type'] = getMime( config.root+ '/' + config.errFile );
					      res.writeHead( httpCode.ok, context.$setHeader);
						    zlib.gzip(data, function(err, gdata){
				             if( err ) throw err;
							 res.end( gdata, config.charset ? config.charset : 'utf8' );
                            });
						  delete context; return; 
						}  
					   if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'deflate' ) >= 0 ){
					    context.$setHeader['content-encoding'] = 'deflate';
					    context.$setHeader['content-type'] = getMime( config.root+ '/' + config.errFile );
					     res.writeHead( httpCode.ok, context.$setHeader);
						  zlib.deflate(data, function(err, gdata){
				             if( err ) throw err;
							 res.end( gdata, config.charset ? config.charset : 'utf8' );
                          });
					      delete context; return;
						}
					}
					context.$setHeader['content-type'] = getMime( config.root+ '/' + config.errFile );
					res.writeHead( httpCode.ok, context.$setHeader);
					res.end( data, config.charset ? config.charset : 'utf8'  );  
					    delete context; return; 
		            
					});
	             }
	             else{//send 404 not found
	               process.nextTick(function(){ 
					res.writeHead( httpCode.nf );
		            res.end();
                         delete context; return;
					});	 
	             }
                }//end else exist
	        }//end if isDir
            if( stats.isFile()){
                if(!isBinary(config.root + url.parse(req.url).pathname)){
                   j2h.init(config.root+url.parse(req.url).pathname );
		           j2h.run(config.showErr != undefined ? config.showErr : true, context, function(err,data){
                    if( err ) throw err;
					 if( config.encode ){ 
				       if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'gzip' ) >= 0 ){
						 context.$setHeader['content-encoding'] = 'gzip';
					     context.$setHeader['content-type'] = getMime( config.root+url.parse(req.url).pathname );
					      res.writeHead( httpCode.ok, context.$setHeader);
						   zlib.gzip(data, function(err, gdata){
				             if( err ) throw err;
							 res.end( gdata, config.charset ? config.charset : 'utf8' );
                           });
						  delete context; return; 
						}  
					   if( req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf( 'deflate' )  >= 0 ){
					    context.$setHeader['content-encoding'] = 'deflate';
					    context.$setHeader['content-type'] = getMime( config.root+url.parse(req.url).pathname );
					     res.writeHead( httpCode.ok, context.$setHeader);
						  zlib.deflate(data, function(err, gdata){
				             if( err ) throw err;
							 res.end( gdata , config.charset ? config.charset : 'utf8'  );
                          });
					      delete context; return;
						}
					 }
					 context.$setHeader['content-type'] = getMime( config.root+url.parse(req.url).pathname );
					 res.writeHead( httpCode.ok, context.$setHeader);
					 res.end( data, config.charset ? config.charset : 'utf8' );  
					    delete context; return; 
                  });
                }//end if not isBinary
            if(isBinary(config.root + url.parse(req.url).pathname)){
              process.nextTick( function(){ 
			    context.$setHeader['content-type'] = getMime( config.root+url.parse(req.url).pathname );
                res.writeHead(httpCode.ok, context.$setHeader);
                fs.createReadStream(config.root + url.parse(req.url).pathname).pipe( res );
                       delete context; return;
			  });	   
            }//end if isBinary
          }//end if isFile
	   });//end fs stats
	  }//end else
    });//end exists
  }//end render

//HTTP Server helper |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|  
 var httpapp = function( config, context, request, response, query, path ){
    this.config = config;
	this.context =context;
	this.request = request;
	this.response = response;
	this.query = query;
	this.path = path;
    this.success = false;
  }
    httpapp.prototype = { 
       
	    get: function( find, type, callback ){
         if( this.success ) return;  
    	  if( type === 'q'  &&  this.query !== undefined ){
            for( key in this.query ){
	          if( find.test( key ) ) 
	   	       { this.success = true; callback(); } 
	        }		
          }
          if( type === 'p'  && this.path !== undefined ){
           if( find.test( this.path ) ) 
		    { this.success = true; callback(); }
          }
        },	
       
	    write: function( file ){
		   file = file || false;
		    render( this.config, this.context, this.request, this.response, file );
        },
	   
		setSession: function( object, callback, timeout ){
		   timeout = timeout * 1000 ||  60 * 1000 ;
			var sessionKey =  Math.random(  );
			  this.response.setHeader( 'set-cookie', [ 'dhttpID=id'+sessionKey.toString( )] )
	          object.dhttpID = sessionKey
		      object.timeout = new Date().getTime() + timeout;
				fs.mkdir('./sessions', function(){
				  fs.writeFile( './sessions/dhttp_id'+object.dhttpID, 'exports.session = (function(){ return ' + util.inspect( object ) + ' })()', function( err ){
                    if( err ){ callback( err ); return; }	
					 callback( );			
		          } );
				} );
 	     },
		
		getSession: function(  ){	
		   if( query.parse( this.request.headers.cookie, '; ').dhttpID !== undefined ){
		     var sessionID = query.parse( this.request.headers.cookie, '; ').dhttpID;
              try{
			    var session = require( './sessions/dhttp_'+sessionID ).session;
                 if( session.timeout < new Date().getTime() )
				   { fs.unlinkSync(  './sessions/dhttp_'+sessionID ); return false; }
			  }
			  catch( e ){
				return false;		     
			 }		 
		   }
		   return session;
	     },
		 
		cache: function( callback, timeout ){
	      timeout = timeout * 1000 || 60 * 1000 ;
		   if( arrCache.indexOf( this.request.headers['if-none-match']  ) >= 0  ){
		       this.response.writeHead( 304 ); this.response.end(); return;
	 	   }
		   if( arrCache.indexOf( this.request.headers['if-none-match'] ) < 0  ){
			 var expires = new Date( ).getTime() +  timeout ;
			 var etag = Math.random();
			 this.response.setHeader( 'Cache-Control' , [ 'private, must-revalidate, max-age='+ timeout +', no-transform' ] );
	         this.response.setHeader( 'Etag', [ etag ] );
			 this.response.setHeader( 'Expires' , [ new Date( expires ).toUTCString() ] );
			 arrCache.push( etag.toString() );
			  setTimeout(function(){
			    arrCache.splice( arrCache.indexOf( etag  ), 1 );
			  }, timeout );
			 callback()
		   }
	     }		   
	} 
//WebSocket Server helper |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|  	
  var wsapp = {
    packet: null,
	
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
	
	getMaskKey: function( packet ){
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
   	   this.packet = Buffer(2);
	   this.packet.writeUInt16BE( 0, 0 );
	   fin ? this.packet[0] = 0x80 : this.packet[0]  ; 
	   opcode > 0 ? this.packet[0] = this.packet[0] | opcode : this.packet[0];  
       masked ? this.packet[1] =  0x80 : this.packet[1] ;	   
	   return this.packet;
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
	   //var packet = null;
	   if( this.isMasked( header ) ){
	    len < 126 ?  this.packet = Buffer( 2 + 4 + len ) : len > 125 && len <= 0xFFFF ? this.packet = Buffer( 2 + 2 + 4 + len ) :  this.packet = Buffer( 2 + 8 + 4 + len ) ;
	    packet.writeUInt16BE( header.readUInt16BE( 0 ), 0 );
		
	   }
	   else{ 
	    len < 126 ?  this.packet = Buffer( 2 + len ) : len > 125 && len <= 0xFFFF ? this.packet = Buffer( 2 + 2 + len ) :  this.packet = Buffer( 2 + 8 + len ) ;
	    this.packet.writeUInt16BE( header.readUInt16BE( 0 ), 0 );
		len < 126 ?  this.packet[1] = this.packet[1] | len : len > 125 && len <= 0xFFFF ? this.packet[1] = this.packet[1] | 126 : this.packet[1] = this.packet[1] | 127 ;
		len < 126 ? len : len > 125 && len <= 0xFFFF ? this.packet.writeUInt16BE( len, 2 ) :  this.packet.writeDoubleBE( len, 2)  ;
		len < 126 ?  this.packet.write(data, 2, len) : len > 125 && len <= 0xFFFF ? this.packet.write( data, 4, len) : this.packet.write( data, 10 , len ) ;
	    return this.packet;
	   }
	 },
     
     ping: function(){
	     return this.createHeader(true, 0x09, false);
	 },	 
	 pong: function(){
	     return this.createHeader(true, 0x0A, false);
	 },
	 
 }

//HTTP HTTPS Server  |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|	 
 exports.dhttp = {
  createServer: function(config, context, callback){
    if( (config.root == undefined) || (config.index == undefined))
     { console.log('one or more configuration variables is not defined'); return false; }
       
	process.chdir( config.root );
    usrfnc.on( 'userFunction', callback);
	
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
   server.wsServer = wsServer;
   
    server.on('request', function( req, res ){
   	 var error = domain.create( ); 
	  error.once('error', function( err ){ 
	   if( err ) deb( err );
	     if( res.writable ){
	        res.writeHead( httpCode.ie );
            res.end( '500 Internal Server Error' )
         }	   
       });
	 error.run(function(){
	  var app = new httpapp( config, context, req, res, url.parse( req.url, true).query, url.parse( req.url ).pathname )
          usrfnc.emit('userFunction', url.parse(req.url,true).query, url.parse(req.url).pathname, req, res, app  );
     });
   });   
   return server; 
  }
 }

//WebSockets Server |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|	
 var wsServer = function( protocol, callback ){
   this.on( 'upgrade', function( req, ws, sign ){
   //server.on('upgrade', function(req, ws, sign){
     if(req.headers['sec-websocket-version'] != undefined && req.headers['upgrade'] == 'websocket'){
       if(req.headers['sec-websocket-protocol'] != undefined && req.headers['sec-websocket-protocol'] == protocol ){
         if( req.headers['sec-websocket-key'] != undefined ){
           wsSecKey = req.headers['sec-websocket-key']+wsMagic; 
           wsHash = crypto.createHash('sha1');
           wsHash.update(wsSecKey);
           wsHandShake = 'HTTP/1.1 101 Switching Protocols\r\n'+
                                'Upgrade: websocket\r\n'+
                                'Connection: Upgrade\r\n'+
                                'Sec-WebSocket-Accept: '+wsHash.digest('base64')+'\r\n'+
                                'Sec-WebSocket-Protocol: '+protocol+'\r\n\r\n';
           ws.write(wsHandShake, 'binary');
           callback( req, ws, wsapp );
	     }else{ ws.end( 'error' ) }
      }else{ ws.end( 'error' ) }
    }else{ ws.end( 'error' ) }
   });
  return this;
 }	
