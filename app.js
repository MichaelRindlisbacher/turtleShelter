let express = require("express");

let app = express();

let path = require("path");

let security = false;

const port = 5001;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));

const db = require("knex") ({ // Setting up connection with pg database
  client : "pg",
  connection : {
      host : process.env.RDS_HOSTNAME || "localhost",
      user : process.env.RDS_USERNAME || "postgres",
      password : process.env.RDS_PASSWORD || "password",
      database :process.env.RDS_DB_NAME || "assignment3",
      port : process.env.RDS_PORT || 5432, // Check port under the properties and connection of the database you're using in pgadmin4
      ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
  }
})

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
