//TODO: [X] Change header to display email instead of userid
//TODO: [X] If user is not logged in, header should display Register/Login buttons
//TODO: [X] If user goes to /, redirects to /urls (if not logged in, goes to login)
//TODO: [X] Remove JS code from index and move to express_server
//TODO: [X] Add a: create a new link button to /urls
//TODO: [-] Redirect /urls to login if not logged in and display error msg
//TODO: [X] /login If user is logged in, redirect to /urls
//TODO: [X] /register If user is logged in, redirect to /urls
//TODO: [X] Clean up comments
//TODO: [X] Remove console.logs
//TODO: [X] Refactor and clean where possible, ES LINT
//TODO: [ ] Final code review

//TEST: [X] Test if no cookie is present
//TEST: [X] Test if short URL is incorrect
//TEST: [X] /url/:id returns error if does not exist

//STRETCH: [ ] /url & /url:id displays Date url was created
//STRETCH: [ ] /url & /url:id displays number of times URL visited
//STRETCH: [ ] /url & /url:id displays number of unique visits
//STRETCH: [ ] Make me pretty.

//INITIALIZE

const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
var cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['iamcornholio'],
  maxAge: 24 * 60 * 60 * 1000
}));

//DATABASES

var urlDatabase = {
  "b2xVn2": {longUrl: "http://lighthouselabs.ca", owner: "test" },
  "9sm5xK": {longUrl: "http://www.google.com", owner: "test"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$9.nTnJJZnLkOgANgHhA3Fe6drPJ6QSQLgzyG7419TpSCrXT3JHr7m"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$buTZmDHuKnDhRKPo8gGkB.L.HUkpHX6mevkj/yLTYHtDRv1d.w8Ni"
  },
  "test": {
    id: "test",
    email: "test@test.com",
    password: "$2a$10$vE5iKdOmE/m4Jd/JvqyyxuJQvjZj8IZwdntz1T.LRjhx4//aSP79W"
  }
};

//FUNCTIONS

var randomString = function generateRandomString() {
  return (Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1));
};

function doesEmailExist (emailInput) {
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

function doesShortURLExist (shortUrl) {
  for (url in urlDatabase) {
    if (shortUrl === url) {
      return true;
    }
  }
}

function fixURL (url) {
  if (url.substring(0, 6) !== 'http://' || url.substring(0, 7) !== 'https://') {
    return ("http://" + url);
  } else {
    return url;
  }
}

function returnUrlListForUser (user) {
  let userUrls = {};
  for(url in urlDatabase) {
    if (urlDatabase[url].owner === user ){
      userUrls[url] = urlDatabase[url] ;
    }
  }
  return userUrls;
}

//ROUTING


app.get("/", (req, res) => {
  res.redirect("/urls");
});


//LOGIN

app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
  if (!req.session.userID){
    res.render("login", templateVars);
  } else if (!(users[req.session.userID] ? users[req.session.userID].email : null)) {
    req.session = null;
    res.redirect("/register");
  } else {
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = doesEmailExist(email);
  if (userId){
    if (bcrypt.compareSync(password, users[userId].password)) {
      req.session.userID = users[userId].id;
      res.redirect('/urls');
    } else {
      res.statusCode = 403;
      res.send('password is incorrect');
    }
  } else {
    res.statusCode = 403;
    res.send('the username does not exist');
  }
});

//LOGOUT

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//REGISTER

app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
  if (!req.session.userID){
    res.render("register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

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
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.userID = users[userId].id;
      res.redirect("/urls");
    }
  } else {
    res.statusCode = 400;
    res.end("Error: Enter a valid email and password");
  }
});

//INDEX

app.get("/urls", (req, res) => {
  let userUrls = returnUrlListForUser(req.session.userID);
  let templateVars = { urls: userUrls, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
  if (req.session.userID && (users[req.session.userID] ? users[req.session.userID].email : null)) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

//NEW URL

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
  if (req.session.userID) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
  const currentUser = req.session.userID;
  const shortUrl = randomString();
  const longURL = fixURL(req.body.longURL);
  urlDatabase[shortUrl] = {longUrl: longURL, owner: currentUser };
  res.redirect("/urls/" + shortUrl);
});

//URL INFO & UPDATE

app.get("/urls/:id", (req, res) => {
  let urlId = req.params.id;
  const currentUser = req.session.userID;
  if (doesShortURLExist(urlId)) {
    if (isAuthorizedtoChange(currentUser, urlId)) {
      let longURL = urlDatabase[urlId].longUrl;
      let templateVars = { shortURL: urlId, longURL: longURL, urls: urlDatabase, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
      res.render("urls_show", templateVars);
    } else {
      res.statusCode = 401;
      res.send('You are not authorized to view this URL. You do not own it or are not logged in.');
    }
  } else {
    res.statusCode = 404;
    res.send('Short URL does not exist.');
  }
});

app.post("/urls/:id/update", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
  const shortUrlToUpdate = req.params.id;
  const updatedLongURL = fixURL(req.body.longURL);
  const currentUser = req.session.userID;
  if ( isAuthorizedtoChange(currentUser, shortUrlToUpdate)) {
    urlDatabase[shortUrlToUpdate].longUrl = updatedLongURL;
    res.redirect("/urls");
  } else {
    res.statusCode = 401;
    res.end("You are not authorized to edit this URL. Please login if you own it.");
  }
});


//DELETE

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.userID, email: users[req.session.userID] ? users[req.session.userID].email : null };
  const urlToDelete = req.params.id;
  const currentUser = req.session.userID;
  if ( isAuthorizedtoChange(currentUser, urlToDelete)) {
    delete urlDatabase[urlToDelete];
    res.redirect("/urls");
  } else {
    res.statusCode = 401;
    res.send("You are not authorized to delete this URL. Please Login.");
  }
});

//REDIRECT SHORT URL

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longUrl);
  } else {
    res.statusCode = 404;
    res.end("Error - Does not exist - Try a different URL or create a new one");
  }
});

//INITIALIZE SERVER

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});