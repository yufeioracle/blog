var express = require("express");
var router = express.Router();
var mysql = require("mysql")
var ejs = require("ejs")
var path = require('path')
var $ = require('jquery')
var bodyParser = require('body-parser')
var url = require('url')
var engine = require('ejs-locals')
var cookieParser = require('cookie-parser')
var captchapng = require("captchapng")
var multer = require("multer")
var crypto = require("crypto")
var Server = require('socket.io');
 var io = new Server(5555);

//require("jquery")
var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./Images");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({ storage: Storage }).array("imgUploader", 3);

router.post("/api/Upload", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            return res.end("Something went wrong!");
        }
        return res.end("File uploaded sucessfully!.");
    });
});

var app = express();
var http = require('http').Server(app);  
//var io = require('socket.io')(http);


app.use(cookieParser());

//app.set("views",__dirname+"/views");
//cnpm i mysql express ejs jquery ejs-locals body-parser -S
io.on('connection', function (socket) {  
    console.log('a user connected');  
    socket.on('disconnect', function () {  
        console.log('user disconnected');  
    });  
    socket.on('message', function (message) {  
        var chat = [];
        console.log('message: ' + message.userName);
        console.log('content: ' + message.content);
        if(message.content == ""){
            connection.query("SELECT * FROM T_CHAT",chat,function(err,result,fields){
                    if(err){
                        console.log("聊天内容插入失败");
                    }else{
                        io.emit('message', result);  
                    }
                }); 
            return ;
        }
        chat.push(message.userName);
        chat.push("18");
        chat.push(message.content);
        chat.push("");
        connection.query("INSERT INTO T_CHAT (NAME,AGE,CONTENT,MOER) VALUES (?,?,?,?)",chat,function(err,result,fields){
            if(err){
                console.log("聊天内容插入失败");
            }else{
                //////////////////////////////
                connection.query("SELECT * FROM T_CHAT",chat,function(err,result,fields){
                    if(err){
                        console.log("聊天内容插入失败");
                    }else{
                        io.emit('message', result);  
                    }
                }); 
                ///////////////////////////////
            }
        });  
        
    });  
});  

app.use(function(req,res,next){
    
    next();
});

app.engine('ejs', engine); 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(__dirname));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use(express.static(path.join(__dirname, 'public')))


var connection = mysql.createConnection({
    host : "127.0.0.1",
    user : "root",
    password : "root",
    port : "3306",
    database: 'blog',
});


connection.connect();

router.get("/login",function(req,res,next){
    
    connection.query('SELECT * FROM T_STUDENT',function(err,result,fields){
                if(err){
                    console.log("查询失败");
                    return;
                }else{
                    //res.send(result);
                    if(isLogin(req)){
                        res.redirect("/main");
                    }else{
                        res.render('login.ejs',{"result" : result});
                    }
                }
            });
});
//显示验证码
router.get("/captchapng",function(req,res,next){
        var random = parseInt(Math.random() * 9000 + 1000);
        res.cookie('random', {random : random}, { maxAge: 900000 }); 
        var p = new captchapng(80, 30, random); // width,height,numeric captcha
        p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
        p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)
        var img = p.getBase64();
        var imgbase64 = new Buffer(img, 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/png'
        });
        res.end(imgbase64);
    
});


router.get("/main",function(req,res,next){
    if(isLogin(req)){
        res.render("main.ejs");
    }else{
        res.redirect("/login?time=" + Date.now());
    }
    
});

function isLogin(req){
        if(req.cookies["code"] != undefined){
            return true;
        }else{
            return false;
        }
};

function getCookie(name) {
            var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
            if (arr = document.cookie.match(reg))
              return unescape(arr[2]);
            else
              return null;
         };




router.get("/regist",function(req,res,next){
    //return res.redirect("/login");
    if(isLogin(req)){
        res.redirect("/main");
    }else{
        res.render("regist.ejs");
    }
    
});
//

app.get("/regist/insert",function(req,res,next){
        var userName = [];
        userName.push(req.query.userName);
        userName.push(req.query.password);
        connection.query("INSERT INTO t_user (Id,userName,PASSWORD) VALUES ('03',?,?)",userName,function(err,result,fields){
            if(err){
                console.log("注册失败，插入数据有误");
            }else{
                console.log("注册成功");
                res.send("0");
                //console.log("注册成功");
            }
        });


});

app.get("/login/isPassword",function(req,res,next){
     var backMsg = {"msg":"aaa","code":3};
     var userName = [];
     var content = req.query.password;
     var md5 = crypto.createHash('md5');
     md5.update(content);
     var password = md5.digest('hex');
    if(req.query.userName == "" || req.query.password == ""){
        backMsg.msg = "用户名或密码不能空";
        res.send(backMsg);
        return;
    }else{
            userName.push(req.query.userName);
            connection.query('SELECT * FROM T_USER WHERE USERNAME=?',userName,function(err,result,fields){
                if(err){
                    console.log("查询失败");
                    return;
                }else{
                    var passWord = "";
                    try{
                        passWord = result[0].PASSWORD;
                    }catch(e){
                        backMsg.msg = "您输入用户名未注册";
                        res.send(backMsg);
                        return;
                    }
                    if(passWord == req.query.password){
                        backMsg.msg = "恭喜登录成功";
                        backMsg.code = 0;
                        //res.cookie("account", {account: userName, hash: hash, last: lastTime}, {maxAge: 60000});
                        res.cookie('code', {code : backMsg.code}, { maxAge: 900000 });
                        res.cookie('userName', {userName : req.query.userName}, { maxAge: 900000 });
                        res.send(backMsg);
                        return;
                    }else{
                        backMsg.msg = "您输入用户名或密码有误";
                        res.send(backMsg);
                        return;
                    }
                }
            });
    }
    
    
});


app.use('/', router);

module.exports = router;

//app.use(static("./www"));
app.listen(4000);