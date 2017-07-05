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

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  console.log(urlDatabase);
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  urlId = req.params.id;
  let templateVars = { shortURL: urlId, longURL: urlDatabase[urlId] };
  res.render("urls_show", templateVars);
});

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

var randomString = function generateRandomString() {
  return (Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1));
}

app.get("/u/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  if (urlDatabase[req.params.shortURL]) {
      res.redirect(urlDatabase[req.params.shortURL]);
  } else {
      res.statusCode = 404;
      res.end("Error - Does not exist - Try a different URL or create a new one")
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});