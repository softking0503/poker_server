var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var gamelog = require('./game_manager/gamelog');
var cors = require('cors');
var logger = require('morgan');

var clientsocket = require('./sockets/clientsocket');
var fs = require('fs')
  , ini = require('ini')
global.config;

global.getconfig = function () {
  var configs = ini.parse(fs.readFileSync('./config.ini', 'utf-8'))
  config = configs;
}

global.setconfig = function () {
  fs.writeFileSync('./config_modified.ini', ini.stringify(config, { section: 'section' }))
}

getconfig();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var server = require('http').createServer(app);
server.timeout = 25000;
var io = require('socket.io')(server, {
  'pingInterval': 1000, 'pingTimeout': 25000, 'rememberTransport': false,
  'reconnect': true,
  'secure': true
});
//var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(function(req, res, next){
//   res.io = io;
//   next();
// });
app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'delux')));
//app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

clientsocket.initdatabase();
io.on('connection', async function (socket) {
  console.log("-One socket connected");
  // socket.binaryType = "arraybuffer";
  await clientsocket.initsocket(socket, io);
});

setInterval(() => {
   console.log("Server is Running");
}, 3000);

module.exports = { app: app, server: server };
