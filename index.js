var express = require('express');
var exphbs  = require('express-handlebars');
var bparse = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');

var app = express();

//Listening port
app.listen(3000);
console.log('Listening at port 3000');

//Handlebars init
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Body-parser init
app.use(bparse.urlencoded({ extended: false }));
app.use(bparse.json());

// Mongoose database
mongoose.connect('mongodb://localhost/usersystem');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('LOGGED | MongoDB Connected - ' + new Date());
});

// Models
// User Collection
let UserSchema = mongoose.Schema({
    name: String,
    pass: String,
    email: String
});

let User = mongoose.model('users', UserSchema);

// Session
app.use(session({
    secret:"anfldnfasnfkldfaa",
    resave:true,
    saveUninitialized:false
}));

// Routers
let routerPublic = express.Router();
let routerLoggedin = express.Router();

// Middlewares
routerPublic.use(function (req, res, next) {
    next();
});
routerLoggedin.use(function (req, res, next) {
    if(typeof req.session.user == 'undefined') {
        res.redirect('/login');
    } else {
        next();
    }
});

// Routes
// HomePage
routerPublic.get('/', function (req, res) {
	res.render('home');
});

// SignupPage
routerPublic.get('/signup', function (req, res) {
	res.render('signup');
});

// Signup DB Post
routerPublic.post('/signup', function (req, res, next) {
    // cheeck password
    var newUser = new User({
        name:req.body.name,
        email: req.body.email,
        pass: req.body.password,
        conf: req.body.confirm
    });
    console.log(newUser);
    newUser.save();
    // console.log(userId);
    res.redirect('/login');
});

// Login Page
routerPublic.get('/login', function (req, res) {
    res.render('login');
});

// Login validation
routerPublic.post('/login', function(req, res) {
    User.findOne({name : req.body.name},(error, document) => {
        if (error) {
            throw error;
        }
        else {
            if (!document) {
                let message = 'No user exists with this username.';

                res.redirect('/login/?message='+message);
            }
            else {
                if (document.pass != req.body.password) {
                    let message = 'The password is incorrect.';
                    res.redirect('/login/?message='+encodeURIComponent(message));
                }
                else {
                    req.session.user = document;
                    res.redirect('/')
                }
            }
        }
    });
});

// About
routerLoggedin.get('/about', function (req, res) {
    res.render('about');
});

app.use(routerPublic);
app.use(routerLoggedin);
