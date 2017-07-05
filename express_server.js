const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//Applies uername info to cookie upon login

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect("/urls");
});

//Logout to clear the cookie info

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

//Creates a new login with a password

app.get("/register", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const userId = randomString();
  
  if (req.body.email && req.body.password) {
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password
    };
    // console.log(users.userID);
    console.log(users);
    res.cookie('username', req.body.email);
    res.redirect("/urls");
  } else {
    res.statusCode = 404;
    res.end("Error: Enter a valid email and password");
  }
});

//Shows all of the URLs that have been created

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

//Displays page to create a new URL

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_new");
});

//Displays the short and long URL for a specific URL specified in the path

app.get("/urls/:id", (req, res) => {
  urlId = req.params.id;
  let templateVars = { shortURL: urlId, longURL: urlDatabase[urlId], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

//creates a new URL with a new shortlink. Works with /new

app.post("/urls", (req, res) => {
  const shortUrl = randomString();
  urlDatabase[shortUrl] = req.body.longURL;
  console.log(shortUrl);
  console.log(req.body);
  console.log(urlDatabase);
  res.redirect("/urls/" + shortUrl);
});

//To delete a URL

app.post("/urls/:id/delete", (req, res) => {
  const urlToDelete = req.params.id;
  delete urlDatabase[urlToDelete];
  res.redirect("/urls");
});

//To update a URL

app.post("/urls/:id/update", (req, res) => {
  const urlToUpdate = req.params.id;
  const updatedLongURL = req.body.longURL;
  urlDatabase[urlToUpdate] = updatedLongURL;
  res.redirect("/urls");
});

//Generates a random short URL

var randomString = function generateRandomString() {
  return (Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1));
}

//Redirects to short URL if exists. Otherwise 404

app.get("/u/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.statusCode = 404;
    res.end("Error - Does not exist - Try a different URL or create a new one");
  }
});

//initializes the server

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});