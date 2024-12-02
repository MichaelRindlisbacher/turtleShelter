let express = require("express");

let app = express();

let path = require("path");

let security = false;

const port = 5000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.render('index');
  });

app.listen(port, () => {
    console.log(`Server is running`);
});