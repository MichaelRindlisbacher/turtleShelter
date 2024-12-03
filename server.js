let express = require("express");

let app = express();

const session = require('express-session'); // imports the session class

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
      password : process.env.RDS_PASSWORD || "Sant1ag020",
      database :process.env.RDS_DB_NAME || "turtle_shelter_project",
      port : process.env.RDS_PORT || 5432, // Check port under the properties and connection of the database you're using in pgadmin4
      ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
  }
})

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

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

app.get('/about/about', (req, res) => {
    res.render('about/about');
  });

app.get('/youhelp/eventrequest', (req, res) => {
    res.render('youhelp/eventrequest');
  });

// Handle form submission
app.post('/submit-event', async (req, res) => {
  try {
    const {
      NumExpectedParticipants,
      activity,
      Date1,
      Date2,
      Date3,
      EventStreetAddress,
      EventCity,
      EventState,
      EventZip,
      StartTime,
      ExpectedDuration, // ExpectedDuration instead of Duration
      CoordFirstName,
      CoordLastName,
      CoordPhone,
      JenStory,
    } = req.body;

    // Create an array for the dates and OptionNum values
    const eventDates = [
      { date: Date1, optionNum: 1 },
      { date: Date2, optionNum: 2 },
      { date: Date3, optionNum: 3 },
    ];

    // Loop through the event dates and insert a row for each
    for (const { date, optionNum } of eventDates) {
      // If the date exists, insert the row into the event table
      if (date) {
        await db('event').insert({
          activity: activity,
          event_street_address: EventStreetAddress,
          event_city: EventCity,
          event_state: EventState,
          event_zip: EventZip,
          num_expected_participants: NumExpectedParticipants,
          expected_duration: ExpectedDuration,
          date: date,
          start_time: StartTime,
          jen_story: JenStory,
          option_num: optionNum,
          coordinator_id: db
            .select('coordinator_id')
            .from('coordinator')
            .where({
              coord_first_name: CoordFirstName,
              coord_last_name: CoordLastName,
              coord_phone: CoordPhone,
            }),
        });
      }
    }

    // Respond to the user (could redirect or show success page)
    res.send('Event submitted successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while submitting the event.');
  }
});

app.get('/youhelp/youhelp', (req, res) => {
    res.render('youhelp/youhelp');
  });

app.get('/youhelp/donate', (req, res) => {
    res.render('youhelp/donate');
  });

app.get('/youhelp/upcoming', (req, res) => {
    res.render('youhelp/upcoming');
  });

app.get('/test', (req, res) => {
  if (req.session.isAdmin) {
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
  } else {
    res.redirect('/login');
  }
});

app.listen(port, () => {
    console.log(`Server is running`);
});

app.post('/login', async (req, res) => {
  console.log('Login form submitted!');
  const { username, password } = req.body;

  // Query your Postgres database to verify the credentials
  const results = await db('credentials').where({ username, password });

  if (results.length > 0) {
    // If the credentials are correct, redirect the user to the admin page
    req.session.isAdmin = true; // Set a session variable to indicate admin status
    res.redirect('/test');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});
