// initialize node, express, and express-session
let express = require("express");

let app = express();

const session = require('express-session'); // imports the session class

let path = require("path");

const port = process.env.PORT || 5005;

// configuration
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));

// donate url
const donateURL = 'https://turtleshelterproject.org/checkout/donate?donatePageId=5b6a44c588251b72932df5a0';

// knex connection object
const db = require("knex") ({ // Setting up connection with pg database
  client : "pg",
  connection : {
      host : process.env.RDS_HOSTNAME || "localhost",
      user : process.env.RDS_USERNAME || "postgres",
      password : process.env.RDS_PASSWORD || "inc0rrect",
      database :process.env.RDS_DB_NAME || "TURTLE_SHELTER_PROJECT",
      port : process.env.RDS_PORT || 5432, // Check port under the properties and connection of the database you're using in pgadmin4
      ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
  }
})

// login session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Check database connection
db.raw('SELECT 1').then(() => {
    console.log('Database connected successfully');
}).catch(err => {
    console.error('Database connection error:', err);
});

// get index
app.get('/', (req, res) => {
  let vestCount = 5901;
  res.render('index', { vestCount: vestCount, req: req });
});

// get login
app.get('/login', (req, res) => {
  req.session.isSuperAdmin = false; // Reset super admin status
  req.session.isAdmin = false; // Reset super admin status
  res.render('login', {req: req});
});

// get story
app.get('/story', (req, res) => {
    res.render('story', {req: req});
  });

// get about
app.get('/about', (req, res) => {
    res.render('about/about', {req: req});
  });

// get homeless and hypothermia
app.get('/about/homeless_cold', (req, res) => {
    res.render('about/homeless_cold', {req: req});
  });

// get vest tech page
app.get('/about/vest_tech', (req, res) => {
    res.render('about/vest_tech', {req: req});
});

// get faq page
app.get('/about/faqs', (req, res) => {
    res.render('about/faqs', {req: req});
  });

// get contact page
app.get('/about/contact', (req, res) => {
    res.render('about/contact', {req: req});
  });

// get eventrequest page
app.get('/youhelp/eventrequest', (req, res) => {
    res.render('youhelp/eventrequest', {req: req});
  });

// redirect to donate page
app.get('/youhelp/donate', (req, res) => {
    res.redirect(donateURL);
  });

// Handle form submission for event requests
app.post('/submit-event', async (req, res) => {
  try {
    // Destructure form data and convert strings to uppercase
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
      StartTime1,
      StartTime2,
      StartTime3,
      ExpectedDuration,
      CoordFirstName,
      CoordLastName,
      CoordPhone,
      JenStory,
    } = req.body;

    // Convert strings to uppercase
    const uppercaseData = {
      eventStreetAddress: EventStreetAddress.toUpperCase(),
      eventCity: EventCity.toUpperCase(),
      eventState: EventState.toUpperCase(),
      coordFirstName: CoordFirstName.toUpperCase(),
      coordLastName: CoordLastName.toUpperCase(),
    };

    // Insert a new coordinator row
    const [newCoordinator] = await db('coordinator')
      .insert(
        {
          coord_first_name: uppercaseData.coordFirstName,
          coord_last_name: uppercaseData.coordLastName,
          coord_phone: CoordPhone,
        },
        ['coordinator_id']
      );

    const coordinatorId = newCoordinator.coordinator_id;

    // Prepare event dates and corresponding start times
    const eventDates = [
      { date: Date1, startTime: StartTime1, optionNum: 1 },
      { date: Date2, startTime: StartTime2, optionNum: 2 },
      { date: Date3, startTime: StartTime3, optionNum: 3 },
    ];

    // Insert event rows for non-null dates
    for (const { date, startTime, optionNum } of eventDates) {
      if (date) {
        await db('event').insert({
          activity: activity.toUpperCase(),
          event_street_address: uppercaseData.eventStreetAddress,
          event_city: uppercaseData.eventCity,
          event_state: uppercaseData.eventState,
          event_zip: EventZip,
          num_expected_participants: NumExpectedParticipants,
          expected_duration: ExpectedDuration,
          date: date, // Date should already be in a valid format
          start_time: `${date} ${startTime}:00`, // Format start_time correctly
          jen_story: JenStory.toUpperCase(),
          option_num: optionNum,
          coordinator_id: coordinatorId,
        });
      }
    }

    // Redirect or show success message
    res.redirect('/success'); // Assuming '/success' is your success route
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while submitting the event.');
  }
});

// get the volunteer signup page
app.get('/youhelp/volunteer', (req, res) => {
  res.render('youhelp/volunteer', {req: req});
});

// Handle form submission for the volunteer signup page
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

// success message
app.get("/success", (req, res) => {
  res.render("success", {req: req});
});

// Route to display events
app.get('/events', (req, res) => {
  if (req.session.isAdmin) {
    db('event')
      .select(
        'event.event_id',
        'event.activity',
        'event.event_street_address',
        'event.event_city',
        'event.event_state',
        'event.event_zip',
        'event.num_expected_participants',
        'event.expected_duration',
        'event.option_num',
        'event.date',
        'event.start_time',
        'event.jen_story',
        'event.num_actual_participants',
        'event.actual_duration',
        'event.num_pockets',
        'event.num_collars',
        'event.num_envelopes',
        'event.num_vests',
        'event.total_products',
        'event.status',
        'event.num_team_members',
        'event.date_created',
        'event.coordinator_id',
        'coordinator.coord_first_name',
        'coordinator.coord_last_name',
        'coordinator.coord_phone'
      )
      .leftJoin('coordinator', 'event.coordinator_id', '=', 'coordinator.coordinator_id') // Join event table with coordinator table
      .orderBy('event.date_created', 'desc')
      .then((events) => {
        // Group events by location (street address, city, state, zip) and status
        console.log(events); // Check if coordinator fields are in the result
        const groupedEvents = {};
 
 
        events.forEach((event) => {
          const locationKey = `${event.event_street_address}-${event.event_city}-${event.event_state}-${event.event_zip}`;
          const status = event.status;
 
 
          if (!groupedEvents[status]) {
            groupedEvents[status] = [];
          }
 
 
          // Group events by location
          const locationGroup = groupedEvents[status].find(group => group.locationKey === locationKey);
          if (!locationGroup) {
            groupedEvents[status].push({
              locationKey: locationKey,
              events: [event]
            });
          } else {
            locationGroup.events.push(event);
          }
        });
 
 
        // Render the grouped events in the EJS template
        res.render('admin/events', { groupedEvents, req: req });
      })
      .catch((error) => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
  } else {
    res.redirect('/login'); // Redirect if not admin
  }
 }); 


// // Route to update the event status
// app.post('/event/:id/:action', (req, res) => {
//   const eventId = req.params.id;
//   const action = req.params.action;

//   let newStatus;
//   switch (action) {
//     case 'accept':
//       newStatus = 'APPROVED';
//       break;
//     case 'decline':
//       newStatus = 'DECLINED';
//       break;
//     case 'completed':
//       newStatus = 'COMPLETED';
//       break;
//     default:
//       return res.status(400).send('Invalid action');
//   }

//   // Update the event status in the database
//   db('event')
//     .where('event_id', eventId)
//     .update({ status: newStatus })
//     .then(() => {
//       res.redirect('/events'); // Redirect back to the events page after updating
//     })
//     .catch((error) => {
//       console.error('Error updating event status:', error);
//       res.status(500).send('Internal Server Error');
//     });
// });

// Route to view a single event
app.get('/event/:id', (req, res) => {
  const eventId = req.params.id;

  db('event')
  .join('coordinator', 'event.coordinator_id', '=', 'coordinator.coordinator_id')
  .where('event.event_id', eventId)
  .select(
    'event.*',
    'coordinator.coord_first_name',  // Use the actual column name
    'coordinator.coord_last_name',
    'coordinator.coord_phone',
  )
  .then((event) => {
    if (event.length === 0) {
      return res.status(404).send('Event not found');
    }

    res.render('admin/viewevent', { event: event[0], req: req });
  })
  .catch((error) => {
    console.error('Error fetching event details:', error);
    res.status(500).send('Internal Server Error');
  });
});

// Route to edit an event
app.get('/event/:id/edit', (req, res) => {
  const eventId = req.params.id;  // Ensure eventId is defined here

  db('event')
    .leftJoin('coordinator', 'event.coordinator_id', '=', 'coordinator.coordinator_id')
    .select(
      'event.*',
      'coordinator.coord_first_name',
      'coordinator.coord_last_name',
      'coordinator.coord_phone'
    )
    .where('event.event_id', eventId)  // Using eventId correctly
    .first()
    .then(event => {
      if (event) {
        res.render('admin/editevent', { event, req: req });
      } else {
        res.status(404).send('Event not found');
      }
    })
    .catch(error => {
      console.error('Error fetching event:', error);
      res.status(500).send('Error fetching event');
    });
});


app.post('/event/:id/edit', (req, res) => {
  const eventId = req.params.id;

  // Log received coordinator_id for debugging
  console.log('Coordinator ID received:', req.body.coordinator_id);

  // Ensure that all fields are properly set for the event
  const updatedEvent = {
    activity: req.body.activity,
    event_street_address: req.body.event_street_address,
    event_city: req.body.event_city,
    event_state: req.body.event_state,
    event_zip: req.body.event_zip,
    num_expected_participants: req.body.num_expected_participants ? parseInt(req.body.num_expected_participants) : null,
    expected_duration: req.body.expected_duration ? parseInt(req.body.expected_duration) : null,
    option_num: req.body.option_num ? parseInt(req.body.option_num) : null,
    date: req.body.date,
    start_time: req.body.start_time,
    jen_story: req.body.jen_story,
    num_actual_participants: req.body.num_actual_participants ? parseInt(req.body.num_actual_participants) : null,
    actual_duration: req.body.actual_duration ? parseInt(req.body.actual_duration) : null,
    num_pockets: req.body.num_pockets ? parseInt(req.body.num_pockets) : null,
    num_collars: req.body.num_collars ? parseInt(req.body.num_collars) : null,
    num_envelopes: req.body.num_envelopes ? parseInt(req.body.num_envelopes) : null,
    num_vests: req.body.num_vests ? parseInt(req.body.num_vests) : null,
    total_products: req.body.total_products ? parseInt(req.body.total_products) : null,
    status: req.body.status,
    num_team_members: req.body.num_team_members ? parseInt(req.body.num_team_members) : null,
  };

  // Ensure that all fields are properly set for the coordinator
  const updatedCoordinator = {
    coord_first_name: req.body.coord_first_name,
    coord_last_name: req.body.coord_last_name,
    coord_phone: req.body.coord_phone,
  };

  // Get coordinator_id from form data and check if it's missing
  let coordinatorId = req.body.coordinator_id;
  
  // If coordinator_id is not provided, create a new coordinator
  if (!coordinatorId || coordinatorId.trim() === "") {
    // Create new coordinator and get the generated ID
    db('coordinator')
      .insert(updatedCoordinator)
      .returning('coordinator_id')
      .then(newCoordinatorId => {
        // Use the new coordinator_id in the event update
        coordinatorId = newCoordinatorId[0].coordinator_id;

        // Now update the event with the new coordinator_id
        return db('event')
          .where('event_id', eventId)
          .update({
            ...updatedEvent,
            coordinator_id: coordinatorId
          });
      })
      .then(() => {
        // Redirect or handle the response after updating
        res.redirect('/events');
      })
      .catch(error => {
        console.error('Error updating event and coordinator:', error);
        res.status(500).send('Error updating event and coordinator');
      });
  } else {
    // If coordinator_id is provided, just update the event
    db('event')
      .where('event_id', eventId)
      .update({
        ...updatedEvent,
        coordinator_id: coordinatorId // Use the existing coordinator_id
      })
      .then(() => {
        // Update the coordinator if necessary
        return db('coordinator')
          .where('coordinator_id', coordinatorId)
          .update(updatedCoordinator);
      })
      .then(() => {
        // Redirect or handle the response after updating
        res.redirect('/events');
      })
      .catch(error => {
        console.error('Error updating event and coordinator:', error);
        res.status(500).send('Error updating event and coordinator');
      });
  }
});


//DELETE an event
app.post('/event/:id/delete', async (req, res) => {
  const eventId = req.params.id;

  try {
    // First, delete all related rows in volunteer_event
    await db('volunteer_event').where('event_id', eventId).del();

    // Then delete the event
    await db('event').where('event_id', eventId).del();

    res.redirect('/events'); // Redirect to the events page
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).send('Error deleting event');
  }
});

//Route to view all volunteers
app.get('/adminvolunteer', async (req, res) => {
  if (req.session.isAdmin) {
    
  
  try {
    // Fetch all volunteers, ordered by volunteer_id
    const volunteers = await db('volunteer').orderBy('volunteer_id', 'asc');

    // Render the adminvolunteer page with the fetched data
    res.render('admin/adminvolunteer', { volunteers, req: req });
  } catch (error) {
    // Log the error and render an error page
    console.error('Error fetching volunteers:', error);

  }

  } else {
    res.redirect('/login'); // Redirect if not admin
  }
});

// Route to view a specific volunteer
app.get('/viewvolunteer/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the volunteer by ID
    const volunteer = await db('volunteer').where({ volunteer_id: id }).first();

    if (!volunteer) {
      return res.status(404).send('Volunteer not found');
    }

    // Render the volunteer details page
    res.render('admin/viewvolunteer', { volunteer, req: req });
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    res.status(500).send('An error occurred while fetching the volunteer.');
  }
});


// Route to display the edit volunteer form
app.get('/editvolunteer/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the volunteer by ID
    const volunteer = await db('volunteer').where({ volunteer_id: id }).first();
    
    // Fetch the available source options (assuming the source options are stored somewhere in the database)
    const sources = ['Website', 'Social Media', 'Flyer', 'Referral', 'Other'];

    if (!volunteer) {
      return res.status(404).send('Volunteer not found');
    }

    // Render the volunteer edit page
    res.render('admin/editvolunteer', { volunteer, sources, req: req });
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    res.status(500).send('An error occurred while fetching the volunteer.');
  }
});

// Route to process the edit volunteer form
app.post('/editvolunteer/:id/edit', async (req, res) => {
  const { id } = req.params;
  const {
    vol_first_name,
    vol_last_name,
    vol_email,
    vol_phone,
    vol_street_address,
    vol_city,
    vol_state,
    vol_zip,
    source,
    sewing_level,
    num_hours,
  } = req.body;

  try {
    // Convert all form data to uppercase before saving
    const updatedVolunteer = {
      vol_first_name: vol_first_name.toUpperCase(),
      vol_last_name: vol_last_name.toUpperCase(),
      vol_email: vol_email.toUpperCase(),
      vol_phone: vol_phone.toUpperCase(),
      vol_street_address: vol_street_address.toUpperCase(),
      vol_city: vol_city.toUpperCase(),
      vol_state: vol_state.toUpperCase(),
      vol_zip: vol_zip.toUpperCase(),
      source: source.toUpperCase(),
      sewing_level: sewing_level.toUpperCase(),
      num_hours,
    };

    // Update the volunteer information in the database
    await db('volunteer')
      .where({ volunteer_id: id })
      .update(updatedVolunteer);

    // Redirect to the volunteer list or another page
    res.redirect('/adminvolunteer');
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).send('An error occurred while updating the volunteer.');
  }
});



// Route to delete a volunteer
app.post('/deletevolunteer/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Delete the volunteer by ID
    await db('volunteer').where({ volunteer_id: id }).del();

    // Redirect back to the admin volunteer page or show a success message
    res.redirect('/adminvolunteer');
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    res.status(500).send('An error occurred while deleting the volunteer.');
  }
});

// Route to view all users
app.get('/superuser/users', (req, res) => {
  if (req.session.isSuperAdmin) {
    db('credentials')
  .select('user_id', 'user_first_name', 'user_last_name', 'username', 'password')
      .then((users) => {
        res.render('admin/superuser/users', { users, req: req });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error fetching data');
      });
  } else {
    res.redirect('/login');
  }
});

// Route to view the user details
app.get('/superuser/viewuser/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch the user details
    const user = await db('credentials').where({ user_id: userId }).first();

    if (user) {
      // Render the viewuser page with the fetched data
      res.render('admin/superuser/viewuser', { user, req: req });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to edit the user details
app.get('/superuser/edituser/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch the user details
    const user = await db('credentials').where({ user_id: userId }).first();

    if (user) {
      // Render the edituser page with the fetched data
      res.render('admin/superuser/edituser', { user, req: req });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle the form submission for editing the user details
app.post('/superuser/edituser/:id', async (req, res) => {
  const userId = req.params.id;
  const { user_first_name, user_last_name, username, password } = req.body;

  try {
    // Update the user details in the database
    await db('credentials').where({ user_id: userId }).update({ user_first_name, user_last_name, username, password });

    // Redirect back to the users page
    res.redirect('/superuser/users');
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to delete a user
app.post('/superuser/deleteuser/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Delete the user from the database
    await db('credentials').where({ user_id: userId }).del();

    // Redirect back to the users page
    res.redirect('/superuser/users');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle login form submission
app.post('/login', async (req, res) => {
  console.log('Login form submitted!');
  const { username, password } = req.body;

  // Query your Postgres database to verify the credentials
  const results = await db('credentials').where({ username, password });

  if (username == "ADMIN" && password == "PASSWORD") {
    // If the credentials are correct, redirect the user to the admin page
    req.session.isSuperAdmin = true; // Set a session variable to indicate super admin status
    req.session.isAdmin = true; // Set a session variable to indicate admin status
    res.redirect('admin/admin');
  } else if (results.length > 0) {
    // If the credentials are correct, redirect the user to the admin page
    req.session.isAdmin = true; // Set a session variable to indicate admin status
    res.redirect('admin/admin');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

// Route to display the admin page
app.get('/admin/admin', (req, res) => {
  if (req.session.isAdmin) {
    // Render the admin page
    res.render('admin/admin', {req: req});
  } else {
    // Redirect to the login page if not admin
    res.redirect('/login');
  }
});

// get addevent
app.get('/addevent', (req, res) => {
  res.render('admin/addevent', {req: req});
});

// Route to update an event
app.post('/addevent', async (req, res) => {
  try {
    // Ensure that all fields are properly set for the coordinator
    const newCoordinator = {
      coord_first_name: req.body.coord_first_name,
      coord_last_name: req.body.coord_last_name,
      coord_phone: req.body.coord_phone,
    };

    // Insert the coordinator and get the coordinator_id
    const [coordinator] = await db('coordinator').insert(newCoordinator).returning('coordinator_id');
    
    // Ensure that all fields are properly set for the event, including the coordinator_id
    const newEvent = {
      activity: req.body.activity,
      event_street_address: req.body.event_street_address,
      event_city: req.body.event_city,
      event_state: req.body.event_state,
      event_zip: req.body.event_zip,
      num_expected_participants: req.body.num_expected_participants ? parseInt(req.body.num_expected_participants) : null,
      expected_duration: req.body.expected_duration ? parseInt(req.body.expected_duration) : null,
      option_num: req.body.option_num ? parseInt(req.body.option_num) : null,
      date: req.body.date,
      start_time: req.body.start_time,
      jen_story: req.body.jen_story,
      num_actual_participants: req.body.num_actual_participants ? parseInt(req.body.num_actual_participants) : null,
      actual_duration: req.body.actual_duration ? parseInt(req.body.actual_duration) : null,
      num_pockets: req.body.num_pockets ? parseInt(req.body.num_pockets) : null,
      num_collars: req.body.num_collars ? parseInt(req.body.num_collars) : null,
      num_envelopes: req.body.num_envelopes ? parseInt(req.body.num_envelopes) : null,
      num_vests: req.body.num_vests ? parseInt(req.body.num_vests) : null,
      total_products: req.body.total_products ? parseInt(req.body.total_products) : null,
      status: req.body.status,
      num_team_members: req.body.num_team_members ? parseInt(req.body.num_team_members) : null,
      coordinator_id: coordinator.coordinator_id, // Set the coordinator_id for the event
    };

    // Insert the event
    await db('event').insert(newEvent);

    // Redirect back to the events page
    res.redirect('/events');
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).send('Error adding event');
  }
});


// get addvolunteer
app.get('/addvolunteer', (req, res) => {
  const sources = ['Website', 'Social Media', 'Flyer', 'Referral', 'Other'];
  res.render('admin/addvolunteer', {req: req, sources});
});

// Route to process the edit volunteer form
app.post('/addvolunteer', async (req, res) => {
  const {
    vol_first_name,
    vol_last_name,
    vol_email,
    vol_phone,
    vol_street_address,
    vol_city,
    vol_state,
    vol_zip,
    source,
    sewing_level,
    num_hours,
  } = req.body;

  try {
    // Convert all form data to uppercase before saving
    const updatedVolunteer = {
      vol_first_name: vol_first_name.toUpperCase(),
      vol_last_name: vol_last_name.toUpperCase(),
      vol_email: vol_email.toUpperCase(),
      vol_phone: vol_phone.toUpperCase(),
      vol_street_address: vol_street_address.toUpperCase(),
      vol_city: vol_city.toUpperCase(),
      vol_state: vol_state.toUpperCase(),
      vol_zip: vol_zip.toUpperCase(),
      source: source.toUpperCase(),
      sewing_level: sewing_level.toUpperCase(),
      num_hours,
    };

    // Update the volunteer information in the database
    await db('volunteer')
      .insert(updatedVolunteer);

    // Redirect to the volunteer list or another page
    res.redirect('/adminvolunteer');
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).send('An error occurred while updating the volunteer.');
  }
});

// get adduser
app.get('/adduser', (req, res) => {
  res.render('admin/superuser/adduser', {req: req});
});

// Route to handle the form submission for editing the user details
app.post('/adduser', async (req, res) => {
  const { user_first_name, user_last_name, username, password } = req.body;

  try {
    // Update the user details in the database
    await db('credentials').insert({ user_first_name, user_last_name, username, password });

    // Redirect back to the users page
    res.redirect('/superuser/users');
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// start the server
app.listen(port, () => {
  console.log(`Server is running`);
});