var dhttp = require('./dhttp').dhttp;
var ws = require('./dhttp').ws
var util = require('util');
var fs = require('fs');
var http = require('http');
var zlib = require('zlib');


//server configuration - конфиг сервера
var config = {
 //server type [ http || https] - Тип создаваемого сервера 
 type: 'http', 
 //https configuration - Опции TLS(SSL)
 https: {key: '/var/node/cert/nodejskey.pem', cert: '/var/node/cert/nodejscert.pem'},
 //listening port - Порт
 port:  8090,
 //root directory - Корневая директория без завершающего слеша
 root: 'c:/node/Seo',
 //index file - Имя файла который будет обработан если в URL передана только директория и/или директория и параметры
 index : 'index.htm',
 //error file - Файл будет обработан при 404 ошибке
 errFile:'err.htm',
 //show error message[ true || false] - отображать или нет ошибки в шаблоне
 showErr: true,
 //lock files - заблокированые файлы при их запросе будет сгенерирована 404 ошибка
 noRun: ['node', 'admin.js', 'j2h/*', 'test/*', 'dhttp.js', 'server.js'],
 //character set - Кодировка
 charset: 'utf8',
 //encode data
 encode: true,
 //WebSockets config
 wsconfig: { proto: 'chat' },
}

var main = {
  sesion: 0,
  test: 0,
}
var sockets = []; 
 
var on = dhttp.createServer(config, main, function( query, path, req, res, app ){  

//console.log( req.headers );
//AJAX
   app.get( /dhttp/i, 'q',  function(){
	  res.writeHead( 200 );
	  res.end( JSON.stringify( { hello: ' hello dhttp server'} ) );
    } );

//WebSockets 
    app.get( /^\/ws$/i, 'p', function(){
	 sockets.push( res );
	 setInterval(function(){
		res.write( ws.ping() );
	 }, 3000);
 
  res.on('data', function(mess){
	if( ws.getDataType( mess )  == 10 ){
	    console.log( 'pong ответ от ' + res.remoteAddress );}
    if( ws.getDataType( mess )  == 9 ){
	    console.log( 'ping запрос от ' + res.remoteAddress );
        res.write( ws.pong() );
	}
	if(ws.getDataType( mess ) == 1 ){
	  for( var i = 0; i < sockets.length; i++ ){
	   	sockets[i].write( ws.addData( ws.getData(mess), true, 1, false) )
	  } 
     }	
    });
    res.on('end', function(){
      console.log('socket index '+ sockets.indexOf( res ) +' close');
	  sockets.splice( sockets.indexOf( res ), 1 );
    });
  });

//write file
    app.get( /test\//, 'p',  function(){
	  	 app.write('c:/node/Seo/test.txt' )
    });   

//response html, template, js, css, binary 
   app.get(/\//, 'p', function(){
      app.write();
   })
   

});

console.log( on ? 'server:8090': 'error');


