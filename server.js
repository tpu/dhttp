var dhttp = require('./dhttp').dhttp;
var fs = require('fs');

//server configuration - конфиг сервера
var config = {
 //server type [ http || https || ws] - Тип создаваемого сервера 
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
}

//user object - пользовательский обьект его свойства доступны в шаблоне 
var main = {
 src: '/var/node',
 path: '',
 data: '',
 ses: 0,
}

//запуск сервера  (обьект конфигурации , параметры пользователя, 
//Функция выполняется при поступлении запроса параметры:  
//1)разобранная строка запроса 
//2)путь в url  )
//3)request
//4)response
//5)event 

var on = dhttp.createServer(config, main, function(q,p,req,res,render){  
  main.path = main.src + p ;
  
 if(q.dhttp == 'j2h'){ 
    res.end('{"user":"j2h"}'); 
    return; 
  }
  
 if(p == '/'){
   fs.readFile('/etc/passwd', function(err,data){
    main.data = data;
    render.emit('run',req,res); main.data = ''; 
   return;
   });
 }

 else{
   render.emit('run',req,res);
 }
});

console.log( on ? 'server:85': 'error');


