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
      password : process.env.RDS_PASSWORD || "inc0rrecT123",
      database :process.env.RDS_DB_NAME || "TURTLE_SHELTER_PROJECT",
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

  app.post('/submit-event', async (req, res) => {
    try {
        // Extract event data from the request body
        const {
            NumExpectedParticipants,
            activity,
            Date1,
            StartTime1,
            Date2,
            StartTime2,
            Date3,
            StartTime3,
            EventStreetAddress,
            EventCity,
            EventState,
            EventZip,
            ExpectedDuration,
            CoordFirstName,
            CoordLastName,
            CoordPhone,
            JenStory
        } = req.body;

        // Convert inputs to uppercase where applicable
        const eventDetails = {
            NumExpectedParticipants,
            activity: activity.toUpperCase(),
            EventStreetAddress: EventStreetAddress.toUpperCase(),
            EventCity: EventCity.toUpperCase(),
            EventState: EventState.toUpperCase(),
            EventZip: EventZip,
            ExpectedDuration,
            CoordFirstName: CoordFirstName.toUpperCase(),
            CoordLastName: CoordLastName.toUpperCase(),
            CoordPhone: CoordPhone.toUpperCase(),
            JenStory: JenStory.toUpperCase()
        };

        // Prepare SQL query to insert shared event details and associated dates/times
        const eventQuery = `
            INSERT INTO Events (
                NumExpectedParticipants, Activity, EventStreetAddress, EventCity,
                EventState, EventZip, ExpectedDuration, CoordFirstName, CoordLastName,
                CoordPhone, JenStory
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING EventID
        `;
        const eventValues = [
            eventDetails.NumExpectedParticipants,
            eventDetails.activity,
            eventDetails.EventStreetAddress,
            eventDetails.EventCity,
            eventDetails.EventState,
            eventDetails.EventZip,
            eventDetails.ExpectedDuration,
            eventDetails.CoordFirstName,
            eventDetails.CoordLastName,
            eventDetails.CoordPhone,
            eventDetails.JenStory
        ];

        // Insert the event and get the EventID
        const eventResult = await db.query(eventQuery, eventValues);
        const eventID = eventResult.rows[0].eventid;

        // Insert associated dates and times into the EventDates table
        const dateQuery = `
            INSERT INTO EventDates (EventID, EventDate, StartTime)
            VALUES ($1, $2, $3)
        `;
        const dateValues = [];

        if (Date1 && StartTime1) dateValues.push([eventID, Date1.toUpperCase(), StartTime1.toUpperCase()]);
        if (Date2 && StartTime2) dateValues.push([eventID, Date2.toUpperCase(), StartTime2.toUpperCase()]);
        if (Date3 && StartTime3) dateValues.push([eventID, Date3.toUpperCase(), StartTime3.toUpperCase()]);

        for (const [eventId, date, time] of dateValues) {
            await db.query(dateQuery, [eventId, date, time]);
        }

        // Redirect to a confirmation page or success message
        res.redirect('/event-confirmation');
    } catch (error) {
        console.error('Error inserting event:', error);
        res.status(500).send('An error occurred while submitting the event.');
    }
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
