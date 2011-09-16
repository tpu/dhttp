var dhttp = require('./dhttp').dhttp;

//конфиг сервера
var config = {
 //server type [ http || https || ws] - Тип создаваемого сервера 
 type: 'https', 
 //https configuration - Опции TLS(SSL)
 https: {key: '/var/node/cert/nodejskey.pem', cert: '/var/node/cert/nodejscert.pem'},
 //listening port - Порт
 port:  443,
 //root directory - Корневая директория без завершающего слеша
 root: '/var/node',
 //index file - Имя файла который будет обработан если в URL передана только директория и/или директория и параметры
 index : 'index.htm',
 //error file - Файл будет обработан при 404 ошибке
 errFile:'err.htm',
 //show error message[ true || false] - отображать или нет ошибки в шаблоне
 showErr: true,
 //lock file - заблокированые файлы при их запросе будет сгенерирована 404 ошибка
 noRun: ['node', 'admin.js'],
 //character set - Кодировка
 charset: 'utf8',
}

//пользовательский обьект его свойства доступны в шаблоне 
var main = {
 src: '/var/node',
 path: '',
 echo: console.log,
}

//запуск сервера  (обьект конфигурации , параметры пользователя, 
//Функция выполняется при поступлении запроса параметры - 1)разобранная строка запроса 1) путь в e  )

var on = dhttp.createServer(config, main, function(q,p){  main.path = main.src + p ;});
console.log( on ? 'server:443': 'error');


