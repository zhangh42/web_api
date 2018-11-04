var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var MongoClient = require('mongodb').MongoClient;
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const url = 'mongodb://localhost:27017';
const dbName = 'web_api';
const client = new MongoClient(url);

client.connect(function (err) {
    if (err) {
        console.log('数据库连接错误');
        throw err;
    }
    console.log('数据库连接成功！');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

const session_key = 'faienkd84Dkds993SkIjd';

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(session_key));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: session_key,
    resave: true,
    saveUninitialized: true
}));

const OK_res = { 'code': 0, 'msg': 'ok' }
function err_res(code, msg) {
    return {
        'code': code,
        'msg': msg
    }
}
//app.use('/', indexRouter);
//app.use('/users', usersRouter);
// 登陆
app.post('/user', function (req, res) {
    data = req.body;
    if (!('name' in data) || !('pass' in data)) {
        return res.json(err_res(2, '参数错误'));
    }
    var name = data['name'];
    var pass = data['pass'];
    user_info = { 'name': name, 'pass': pass }
    const db = client.db(dbName);
    const collection = db.collection('users');
    collection.find({ 'name': name }).toArray(function (err, docs) {
        if (err) {
            throw err;
        }
        if (docs.length >= 1) {
            console.log(docs);
            user_info = docs[0];
            if (user_info['pass'] != pass) {
                return res.json(err_res(2, '密码错误'));
            }
            req.session.user = user_info;
            return res.json(OK_res);
        }
        collection.insertOne({ 'name': name, 'pass': pass }, function (err, result) {
            if (err) {
                throw err;
            }
            req.session.user = user_info;
            res.json(OK_res);
        });
    });
});

// 动作时间上报
app.get('/action', function (req, res) {
    if (!req.session.user) {
        return res.json(err_res(2, '未登录'));
    }
    user_info = req.session.user;
    name = user_info['name'];
    const db = client.db(dbName);
    const collection = db.collection('action_time');
    action_infos = [];
    collection.find({ 'name': name }).toArray(function (err, docs) {
        if (err) {
            throw err;
        }
        for (var i = 0; i < docs.length; i++) {
            action_infos.push(docs[i]);
        }
        return res.json(action_infos);
    });
});

app.post('/action', function (req, res) {
    if (!req.session.user) {
        return res.json(err_res(2, '未登录'));
    }
    user_info = req.session.user;
    name = user_info['name'];
    data = req.body;
    if (!('action_id' in data) || !('action_update_time' in data)) {
        return res.json(err_res(2, '参数错误'));
    }
    action_id = data['action_id'];
    action_update_time = data['action_update_time'];
    const db = client.db(dbName);
    const collection = db.collection('action_time');
    collection.find({ 'name': name, 'action_id': action_id }).toArray(function (err, docs) {
        if (err) {
            throw err;
        }
        if (docs.length > 0) {
            // 更新
            collection.updateOne({ 'name': name, 'action_id': action_id }, {
                $set: { 'action_update_time': action_update_time }
            }, function (err, result) {
                if (err) {
                    throw err;
                }
            });
            return res.json(OK_res);
        }
        else {
            collection.insertOne({
                'name': name, 'action_id': action_id, 'action_update_time':
                    action_update_time
            }, function (err, result) {
                if (err) {
                    throw err;
                }
                return res.json(OK_res);
            })
        }
    });
});

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

module.exports = app;
