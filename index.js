let express = require("express");

let app = express();

let path = require("path");

let security = false;

const port = 5001;

const knex = require('knex')

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));

const db = knex({
    client: 'pg',
    connection: {
        host     : '127.0.0.1',
        user     : 'root',
        password : '',
        database : 'project'
    }
});

db.raw('SELECT 1').then(() => {
    console.log('Database connected successfully');
}).catch(err => {
    console.error('Database connection error:', err);
});

app.get('/', (req, res) => {
    res.render('index');
  });

app.get('/login', (req, res) => {
    res.render('login');
  });

app.get('/story', (req, res) => {
    res.render('story');
  });

app.get('/about', (req, res) => {
    res.render('about');
  });

app.get('/eventrequest', (req, res) => {
    res.render('eventrequest');
  });

app.get('/youhelp', (req, res) => {
    res.render('youhelp');
  });

app.get('/donate', (req, res) => {
    res.render('donate');
  });

app.listen(port, () => {
    console.log(`Server is running`);
});