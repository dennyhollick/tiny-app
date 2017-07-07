//TODO: [X] Change header to display email instead of userid
//TODO: [X] If user is not logged in, header should display Register/Login buttons
//TODO: [ ] If user goes to /, redirects to /urls (if not logged in, goes to login)
//TODO: [ ] Remove JS code from index and move to express_server
//TODO: [ ] Add a: create a new link button to /urls
//TODO: [ ] Redirect /urls to login if not logged in and display error msg
//TODO: [ ] /login If user is logged in, redirect to /urls
//TODO: [ ] /register If user is logged in, redirect to /urls
//TODO: [ ] Clean up comments
//TODO: [ ] Remove console.logs
//TODO: [ ] Refactor and clean where possible, ES LINT
//TODO: [ ] Final code review

//TEST: [ ] Test if no cookie is present
//TEST: [ ] Test if short URL is incorrect
//TEST: [ ] /url/:id returns error if does not exist

//STRETCH: [ ] /url & /url:id displays Date url was created
//STRETCH: [ ] /url & /url:id displays number of times URL visited
//STRETCH: [ ] /url & /url:id displays number of unique visits
//STRETCH: [ ] Make me pretty.


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
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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


app.get("/", (req, res) => {
  res.redirect("/urls");
});


//Serves the login page when requested

app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  res.render("login", templateVars);
});

//Applies user info to cookie upon login

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = doesEmailExist(email);
  if (userId){
    if (bcrypt.compareSync(password, users[userId].password)) {
      console.log(req.session);
      req.session.user_id = users[userId].id;
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

//Logout to clear the cookie info

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//Page to create a new login

app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
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
        password: bcrypt.hashSync(req.body.password, 10)
      };
      console.log(users[userId]);
      req.session.user_id = users[userId].id;
      res.redirect("/urls");
    }
  } else {
    res.statusCode = 400;
    res.end("Error: Enter a valid email and password");
  }
});

//Page shows all of the URLs that have been created

app.get("/urls", (req, res) => {
  // TODO: filter out urls that aren't mine HERE, rather than in the view
  let templateVars = { urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  if (req.session.user_id) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Page displated to create a new URL

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Page displays the short and long URL for a specific URL specified in the path

app.get("/urls/:id", (req, res) => {
  let urlId = req.params.id;
  const currentUser = req.session.user_id;
  if (doesShortURLExist(urlId)) {
    if (isAuthorizedtoChange(currentUser, urlId)) {
      let longURL = urlDatabase[urlId].longUrl
      let templateVars = { shortURL: urlId, longURL: longURL, urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
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

//creates a new URL with a new shortlink. Works with /new

app.post("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  const currentUser = req.session.user_id;
  const shortUrl = randomString();
  const longURL = fixURL(req.body.longURL);
  urlDatabase[shortUrl] = {longUrl: longURL, owner: currentUser };
  console.log(shortUrl);
  console.log(req.body);
  console.log(urlDatabase);
  res.redirect("/urls/" + shortUrl);
});

//To delete a URL

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  const urlToDelete = req.params.id;
  const currentUser = req.session.user_id;
  if ( isAuthorizedtoChange(currentUser, urlToDelete)) {
    delete urlDatabase[urlToDelete];
    res.redirect("/urls");
  } else {
    res.statusCode = 401;
    res.send("You are not authorized to delete this URL. Please Login.");
  }
});

//To update a URL

app.post("/urls/:id/update", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.session.user_id, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  const shortUrlToUpdate = req.params.id;
  const updatedLongURL = fixURL(req.body.longURL);
  const currentUser = req.session.user_id;

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
};

//Redirects to short URL if exists. Otherwise 404

app.get("/u/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longUrl);
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

function doesShortURLExist (shortUrl) {
  for (url in urlDatabase) {
    if (shortUrl === url) {
      return true;
    }
  }
}

function fixURL (url) {
  if (url.substring(0,6) !== 'http://' || url.substring(0,7) !== 'https://') {
    return ("http://" + url);
  } else {
    return url;
  }
}

//initializes the server

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});