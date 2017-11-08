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
var Cookies = require('cookies')

//require("jquery")

var app = express();

//app.set("views",__dirname+"/views");
//cnpm i mysql express ejs jquery ejs-locals body-parser -S


app.use(function(req,res,next){
    //app.use(cookieParser());
    req.cookies = new Cookies(req,res);
    console.log(req.headers.cookie);
    if (req.headers.cookie){
        console.log("存在cookie了");
    }else{
         console.log("不存在cookie了");
    }
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
                    res.render('login.ejs',{"result" : result});
                }
            });
});




router.get("/main",function(req,res,next){
    //return res.redirect("/login");
    res.render("main.ejs");
});

router.get("/regist",function(req,res,next){
    //return res.redirect("/login");
    res.render("regist.ejs");
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
    console.log(req.query);
    if(req.query.userName == "" || req.query.password == ""){
        backMsg.msg = "用户名或密码不能为空";
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
                        console.log("恭喜登录成功");
                        backMsg.code = 0;
                        res.cookie('code', "12121212", { maxAge: 900000 });
                        //res.cookie('code', backMsg.code, { maxAge: 900000 });
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
app.listen(4321);