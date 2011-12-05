var dhttp = require('./dhttp').dhttp;
var fs = require('fs');

//server configuration - конфиг сервера
var config = {
 //server type [ http || https] - Тип создаваемого сервера 
 type: 'http', 
 //https configuration - Опции TLS(SSL)
 https: {key: '/var/node/cert/nodejskey.pem', cert: '/var/node/cert/nodejscert.pem'},
 //listening port - Порт
 port:  85,
 //root directory - Корневая директория без завершающего слеша
 root: '/var/node',
 //index file - Имя файла который будет обработан если в URL передана только директория и/или директория и параметры
 index : 'index.htm',
 //error file - Файл будет обработан при 404 ошибке
 errFile:'err.htm',
 //show error message[ true || false] - отображать или нет ошибки в шаблоне
 showErr: true,
 //lock files - заблокированые файлы при их запросе будет сгенерирована 404 ошибка
 noRun: ['node', 'admin.js', 'js2html/*', 'test/*'],
 //character set - Кодировка
 charset: 'utf8',
 //WebSockets config
 wsconfig: { proto: 'chat', },
}

//user object - пользовательский обьект его свойства доступны в шаблоне 
var main = {
 src: '/var/node',
 path: '',
 data: '',
 ses: 0,
}

//createServer(обьект конфигурации , параметры пользователя, Анонимная Функция {параметры:}:  
//1)разобранная строка запроса 
//2)путь в url  )
//3)Обьект request
//4)Обьект response
//5)event обработки шаблона 
//В случае WS Запроса event == false, res == stream

var on = dhttp.createServer(config, main, function(query,path,req,res,render){  
  
 if(!render){//WebSocket запрос возврашяем данные шаблон не обрабатываем
  res.on('data', function(mess){
   //console.log('mess');
    if( res.writable )
    res.write(mess);
   } 
  });
  return;
 } 
 
 if(query.dhttp == 'j2h'){//Ajax Запрос возвращяем данные шаблон не обрабатываем 
    res.end('{"user":"j2h"}'); 
    return; 
  }
  
 //НТТР Запрос используем асинхронную функцию так как в шаблоне этого делать нельзя
 //затем выполняем шаблон.
 if(path == '/'){
   fs.readFile('/etc/passwd', function(err,data){
    main.data = data;
     render.emit('run',req,res); 
    main.data = ''; 
   return;
   });
 }
 
 //НТТР Запрос сдесь к примеру просто обрабатываем шаблон. 
 render.emit('run',req,res);

});

console.log( on ? 'server:85': 'error');


