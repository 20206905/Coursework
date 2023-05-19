//---------------------------------------------------------------------------
// Requires.

const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
// const url = require("url");

const uri = require("./atlas_uri");
// const { Console } = require("console");

//----------------------------------------------------------------------------
// Initialization.

const app = express();

const client = new MongoClient(uri);
const dbname = "coursework";
const collection_name = "users";

const usersCollection = client.db(dbname).collection(collection_name);

var userAccount = {
  name: "temp",
  email: "tempEmail",
  password: "tempPassword",
};

var documentToFind = { email: "jonathanculling@me.com" };

const server = http.createServer(app);
const io = new Server(server);

//----------------------------------------------------------------------------
// MongoDB functions

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
  } catch (err) {
    console.error(`Error connecting to the databse: ${err}`);
  }
};

const registerUser = async () => {
  try {
    await connectToDatabase();
    // insertOne method is used here to insert the sampleAccount document
    let result = await usersCollection.insertOne(userAccount);
    console.log(`Inserted document: ${result.insertedId}`);
  } catch (err) {
    console.error(`Error inserting document: ${err}`);
  } finally {
    await client.close();
  }
};

const loginUser = async () => {
  try {
    await connectToDatabase();
    let result = await usersCollection.findOne(documentToFind);
    console.log("Found one document.");
    console.log(result);
    return result;
  } catch (err) {
    console.error(`Error finding document: ${err}`);
  } finally {
    await client.close();
  }
};

//----------------------------------------------------------------------------
// Application Functionality.

server.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});

//----------------------------------------------------------------------------
// Application uses.

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "secret",
    cookie: { secure: false },
  })
);

app.use(express.static("public"));

//----------------------------------------------------------------------------
// Application GET requests.

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");

  if (req.session.user) {
    console.log("True.");
    console.log("req.session.user = " + req.session.user);
    // res.send(`<p>Logged in as: ${req.session.user.name}</p>`);
  } else {
    console.log("False");
  }
});

app.get("/register.html", (req, res) => {
  res.sendFile(__dirname + "/public/register.html");
});

app.get("/login.html", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.get("/get-username", (req, res) => {
  res.json({ user: req.session.user });
});

app.get("/home.html", (req, res) => {
  res.sendFile(__dirname + "/public/home.html");
});

app.get("/:id", (req, res) => {
  if (req.session.user) {
    console.log("They are logged in.");

    let currentUrl = req.url;
    console.log("currentUrl = " + currentUrl);

    let pageId = currentUrl.slice(1, 25);

    if (req.session.user._id == pageId) {
      console.log("They are the streamer.");
      res.sendFile(__dirname + "/public/stream.html");
    } else {
      res.sendFile(__dirname + "/public/stream.html");
    }
  } else {
    console.log("They are a viewer.");
  }
});

//----------------------------------------------------------------------------
// Application POST requests.

app.post("/register.html", (req, res) => {
  var userName = req.body.name;
  var userEmail = req.body.email;
  var userPassword = req.body.password;

  userAccount = {
    name: `${userName}`,
    email: `${userEmail}`,
    password: `${userPassword}`,
  };

  registerUser();

  res.redirect("index.html");
});

app.post("/login.html", async (req, res) => {
  var userEmail = req.body.email;
  var userPassword = req.body.password;

  userAccount = {
    email: `${userEmail}`,
    password: `${userPassword}`,
  };

  documentToFind = { email: `${userEmail}` };

  let result = await loginUser();

  req.session.user = result;
  req.session.save();

  res.redirect("home.html");
});

//----------------------------------------------------------
// Socket.io.

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
