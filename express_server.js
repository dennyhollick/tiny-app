const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

var urlDatabase = {
  "b2xVn2": {longUrl: "http://www.lighthouselabs.ca", owner: "test" },
  "9sm5xK": {longUrl: "http://www.google.com", owner: "test"}
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
  },
  "test": {
    id: "test",
    email: "test@test.com",
    password: "test"
  }
};


//Serves the login page when requested

app.get("/login", (req, res) => {
  let templateVars = { user: req.cookies["user"] };
  res.render("login", templateVars);
});

//Applies user info to cookie upon login

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = doesEmailExist(email);
  if (userId){
    if(users[userId].password === password ){
      res.cookie('user', JSON.stringify(users[userId]));
      res.redirect('/urls');
    } else {
      res.statusCode = 403;
      res.send('password is incorrect')
    }
  } else {
    res.statusCode = 403;
    res.send('the username does not exist')
  }
});

//Logout to clear the cookie info

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect("/urls");
});

//Page to create a new login

app.get("/register", (req, res) => {
  let templateVars = { user: req.cookies["user"] };
  res.render("register", templateVars);
});

//Creates a new user. Compares it to database first to make sure it doesn't exit and user inputs are valid.

app.post("/register", (req, res) => {
  const userId = randomString();
  
  if (req.body.email && req.body.password) {
    if (doesEmailExist(req.body.email)) {
      res.statusCode = 400;
      res.end("Email already exists as a user. Please login with your email and password.");
    } else {
      users[userId] = {
        id: userId,
        email: req.body.email,
        password: req.body.password
      };
      res.cookie('user', JSON.stringify(users[userId]));
      res.redirect("/urls");
    }
  } else {
    res.statusCode = 400;
    res.end("Error: Enter a valid email and password");
  }
});

//Page shows all of the URLs that have been created

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies["user"] };
  res.render("urls_index", templateVars);
});

//Page displated to create a new URL

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies["user"] };
  if (req.cookies["user"]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Page displays the short and long URL for a specific URL specified in the path

app.get("/urls/:id", (req, res) => {
  urlId = req.params.id;
  let templateVars = { shortURL: urlId, longURL: urlDatabase[urlId].longUrl, user: req.cookies["user"] };
  res.render("urls_show", templateVars);
});

//creates a new URL with a new shortlink. Works with /new

app.post("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies["user"] };
  const currentUser = getCurrentUser(req.cookies["user"]);
  const shortUrl = randomString();
  urlDatabase[shortUrl] = {longUrl: req.body.longURL, owner: currentUser }
  console.log(shortUrl);
  console.log(req.body);
  console.log(urlDatabase);
  res.redirect("/urls/" + shortUrl);
});

//To delete a URL

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies["user"] };
  const urlToDelete = req.params.id;
  const currentUser = getCurrentUser(req.cookies["user"]);
  if ( isAuthorizedtoChange(currentUser, urlToDelete)) { 
    delete urlDatabase[urlToDelete];
    res.redirect("/urls");
  } else {
    res.statusCode = 401;
    res.send("You are not authorized to delete this URL. Please Login.")
  }
});

//To update a URL

app.post("/urls/:id/update", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies["user"] };
  const shortUrlToUpdate = req.params.id;
  const updatedLongURL = req.body.longURL;
  const currentUser = getCurrentUser(req.cookies["user"]);

  //checks to see if there is a cookie. If so, sets currentUser


  //checks if there is a cookie, and if user is authorized to update URL.
  if ( isAuthorizedtoChange(currentUser, shortUrlToUpdate)) {
    urlDatabase[shortUrlToUpdate].longUrl = updatedLongURL;
    res.redirect("/urls");
  } else {
    res.statusCode = 401;
    res.end("You are not authorized to edit this URL. Please login if you own it.");
  }
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

//function will look through users and check if email already exists in database

function doesEmailExist (emailInput) {
  console.log(emailInput);
  for (const user in users) {
    if (emailInput === users[user].email){
      return user;
    }
  }
}

function isAuthorizedtoChange (currentUser, shortUrlToUpdate) {
  const urlOwner = urlDatabase[shortUrlToUpdate].owner;
  if (currentUser === urlOwner) {
    return true;
  }
}

function getCurrentUser (cookie) {
  if (cookie) {
    return JSON.parse(cookie).id;
  } else {
    return "";
  }
}

//initializes the server

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});