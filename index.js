import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import session from 'express-session'
import bodyParser from 'body-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
const port = 7000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'floodsheild-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Set up EJS
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Serve static files
app.use(express.static('public'));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Volunteer authentication middleware
const requireVolunteerAuth = (req, res, next) => {
    if (req.session && req.session.volunteerAuthenticated) {
        next();
    } else {
        res.redirect('/volunteer');
    }
};

// Routes
app.get("/login", (req, res) => {
    // If already logged in, redirect to index
    if (req.session && req.session.authenticated) {
        return res.redirect('/');
    }
    res.render("login");
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email); // Debug log
    
    // Basic validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || password.length < 7) {
        console.log('Validation failed'); // Debug log
        return res.redirect('/login');
    }
    
    // Set session
    req.session.authenticated = true;
    req.session.user = { email };
    console.log('Login successful, redirecting to /'); // Debug log
    
    // Redirect to index.ejs
    res.redirect('/');
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Home route
app.get('/', (req, res) => {
    res.render('index', { 
        user: req.session.user || { email: 'Guest' } 
    });
});
app.get('/dashboard',(req,res) =>{
    res.render('dashboard',{user:req.session.user});
});

app.get("/about", (req, res) => {
    res.render("about", { user: req.session.user });
});

app.get("/checklist", (req, res) => {
    res.render("checklist", { user: req.session.user });
});

app.get("/educator", (req, res) => {
    res.render("educator", { user: req.session.user });
});

app.get("/evacuation", (req, res) => {
    res.render("evacuation");
});

// Volunteer routes
app.get("/volunteer", (req, res) => {
    if (req.session && req.session.volunteerAuthenticated) {
        res.render("volunteer", { isLoggedIn: true });
    } else {
        res.render("volunteer", { isLoggedIn: false });
    }
});

app.post("/volunteer/login", (req, res) => {
    const { email, password } = req.body;
    
    // Basic validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || password.length < 7) {
        return res.redirect('/volunteer');
    }
    
    // Set volunteer session
    req.session.volunteerAuthenticated = true;
    req.session.volunteer = { email };
    
    res.redirect('/volunteer');
});

app.post("/volunteer/signup", (req, res) => {
    const { firstName, lastName, email, password, phone, location } = req.body;
    
    // Basic validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || password.length < 7) {
        return res.redirect('/volunteer');
    }
    
    // Set volunteer session
    req.session.volunteerAuthenticated = true;
    req.session.volunteer = { 
        firstName,
        lastName,
        email,
        phone,
        location
    };
    
    res.redirect('/volunteer');
});

app.get("/volunteer/logout", (req, res) => {
    req.session.volunteerAuthenticated = false;
    req.session.volunteer = null;
    res.redirect('/volunteer');
});

app.get("/live-updates", (req, res) => {
    res.render("live-updates", { user: req.session.user || { email: 'Guest' } });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});