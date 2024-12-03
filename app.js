let express = require("express");

let app = express();

let path = require("path");

let security = false;

const port = 5001;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));

const db = require('knex') ({
    client: 'pg',
    connection: {
        host     : '127.0.0.1',
        user     : 'postgres',
        password : 'w3lc0m3!',
        database : 'turtle_shelter_project',
        port: 5432
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

app.get('/test', (req, res) => {
  db('event')
      .select(
        'event_id',
        'activity',
        'event_street_address',
        'event_city',
        'event_state',
        'event_zip',
        'num_expected_participants',
        'expected_duration',
        'option_num',
        'date',
        'start_time',
        'jen_story',
        'num_actual_participants',
        'actual_duration',
        'num_pockets',
        'num_collars',
        'num_envelopes',
        'num_vests',
        'total_products',
        'status',
        'num_team_members',
        'date_created',
        'coordinator_id'
      ).then((events) => {
        res.render('test', { events });
      })
    // Render the test.ejs template and pass the data
  .catch((error) => {
    console.error('Error querying database:', error);
    res.status(500).send('Internal Server Error');
  });
});

app.listen(port, () => {
    console.log(`Server is running`);
});