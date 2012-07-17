var dhttp = require('./dhttp').dhttp;
var ws = require('./dhttp').ws
var fs = require('fs');
var http = require('http');

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
 //WebSockets config
 wsconfig: { proto: 'chat' },
}

var main = {
  ses: 0,
}

//Функция создания сервера
//параметры:
//( Обьект конфигурации, Пользовательский обьект для передачи в шаблон, КаллБэк функция обработки запросов  )
//параметры КаллБэк:
//( query - разобраная строка запроса, path - путь в запросе, Обьект request, Обьект Response, Функция рендеринга шаблона, Функция просмотра запроса )
var on = dhttp.createServer(config, main, function( query, path, req, res, render, get ){  
 
 //AJAX
 get( 'dhttp', 'q',  function(){
     res.writeHead( 200 );
  res.end( JSON.stringify( { user: 'world' } ) );
 } );
 
 //WebSockets
 get( '/ws', 'p', function(){
     res.on('data', function(mess){
      console.log( 'packet type - ' + ws.getDataType( mess ) );
	  console.log( 'packet fin - ' + ws.isEnd( mess ) );
	  console.log( 'packet masked - ' + ws.isMasked( mess ) );
	  console.log( 'packet mask key - ' + ws.getMaskKey( mess ) );
	  console.log( 'packet data len - ' + ws.getDataLen( mess ) );
	  console.log( 'packet data -' + ws.getTextData( mess ).toString() );
	  
   } );
   res.on('end', function(){
      console.log(' socket end');
   });
 });
 
 //HTTP
 get( '/', 'p',  function(){
 	 render();
  } );
 
});

console.log( on ? 'server:8090': 'error');


