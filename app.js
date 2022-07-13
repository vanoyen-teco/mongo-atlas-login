require('dotenv/config');
const express = require('express');
const session =  require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const User = require('./models/User');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const advancedOptions = {useNewUrlParser: true, useUnifiedTopology: true};

const handlebars = require('express-handlebars')
const {engine} = handlebars;

const app = express();

app.listen(8080, () => console.log("Server Up"));

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        defaultLayout: "layout.hbs",
    })
);

app.set("views", "./views");
app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname ,'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.ATLAS_CNX,
        mongoOptions: advancedOptions
    }),
    key: 'user_sid',
    secret: 'coder',
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 600000} //10 minutos
}));

const sessionChecker = (req, res, next) => {
    if(req.session.user && req.cookies.user_sid){
        res.redirect('/dashboard');
    }else{
        next();
    }
}

app.get('/', sessionChecker, (req, res) => {
    res.redirect("/login");
})

app.route('/login').get(sessionChecker, (req, res) => {
    res.render("login", {
        pageTitle: "LogIn",
        signUp: true
    });
}).post(async (req, res)=>{
    const {username, password} = req.body;
    const docs = await User.findOne({ username: username });
    const comp = (docs != null)?docs.comparePassword(password, docs.password):false;
    if(comp){
        req.session.user = docs;
        res.redirect('/dashboard');
    }else{
        res.redirect('/login');
    }
});

app.route('/signup').get(sessionChecker, (req, res) => {
    res.render("signup", {
        pageTitle: "Sign Up",
        signUp: true
    });
}).post((req, res)=>{
    let user = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });
    user.save((err, docs) => {
        if(err){
            res.redirect('/signup');
        }else{
            req.session.user = docs;
            res.redirect('/dashboard');

        }
    })
})

app.route('/dashboard').get( (req, res) => {
    if(req.session.user && req.cookies.user_sid){
        res.render("dashboard", {
            pageTitle: "Dashboard",
            userName: req.session.user.username,
            loggedIn: true,
            signUp: false
        });
    }else{
        res.redirect('/login');
    }
});

app.route('/logout').get((req, res) => {
    if (req.session.user != undefined) {
        const name = req.session.user.username;
        req.session.destroy(() => {
            req.session = null;
            res.render("logout", {
                pageTitle: "Logout",
                userName: name,
                signUp: false 
            });
        });
    }else{
        res.redirect('/login'); 
    }
    
})
