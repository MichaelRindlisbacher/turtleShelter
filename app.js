let express = require("express");

let app = express();

const session = require('express-session'); // imports the session class

let path = require("path");

let security = false;

const port = process.env.PORT || 5001;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));

const db = require("knex") ({ // Setting up connection with pg database
  client : "pg",
  connection : {
      host : process.env.RDS_HOSTNAME || "localhost",
      user : process.env.RDS_USERNAME || "postgres",
      password : process.env.RDS_PASSWORD || "inc0rrecT123",
      database :process.env.RDS_DB_NAME || "TURTLE_SHELTER_PROJECT",
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

app.get('/youhelp/volunteer', (req, res) => {
  res.render('youhelp/volunteer');
});

app.post("/volunteer", async (req, res) => {
  try {
      // Log the form data for debugging
      console.log("Received form data:", req.body);

      // Destructure and handle undefined values, ensuring they are in uppercase
      const {
          volFirstName,
          volLastName,
          volEmail,
          volPhone,
          volStreetAddress,
          volCity,
          volState,
          volZip,
          source,
          sewingLevel,
          numHours,
      } = req.body;

      // Ensure numHours is a valid number or fallback to 0 if invalid
      let numHoursValue = 0;
      if (numHours && !isNaN(numHours)) {
          numHoursValue = parseFloat(numHours);
      } else {
          console.log("Invalid or empty numHours value, setting to 0");
      }

      // Prepare the data for inserting into the database
      const uppercaseData = {
          vol_first_name: (volFirstName || "").toUpperCase(),
          vol_last_name: (volLastName || "").toUpperCase(),
          vol_email: (volEmail || "").toUpperCase(),
          vol_phone: (volPhone || "").toUpperCase(),
          vol_street_address: (volStreetAddress || "").toUpperCase(),
          vol_city: (volCity || "").toUpperCase(),
          vol_state: (volState || "").toUpperCase(),
          vol_zip: (volZip || "").toUpperCase(),
          source: (source || "").toUpperCase(),
          sewing_level: (sewingLevel || "").toUpperCase(),
          num_hours: numHoursValue, // Ensure it's a valid number or 0
      };

      // Log the data to be inserted for debugging
      console.log("Data to be inserted into the database:", uppercaseData);

      // Insert data into the 'volunteer' table and return the volunteer_id
      const volunteerID = await db("volunteer")
          .insert(uppercaseData)
          .returning("volunteer_id");

      console.log(`Volunteer added with ID: ${volunteerID}`);
      res.redirect("/success");
  } catch (error) {
      console.error("Error adding volunteer:", error);
      res.status(500).send("An error occurred while adding the volunteer.");
  }
});


app.get("/success", (req, res) => {
  res.render("success"); // This renders the success.ejs file
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