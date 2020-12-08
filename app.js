require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require( 'ejs' );
const mongoose = require( 'mongoose' );
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});

const userSchema = {
  email: String,
  password: String
}

const User = new mongoose.model('User', userSchema);

// function authenticateToken(req, res, next) {
//   // Gather the jwt access token from the request header
//   const authHeader = req.headers['authorization']
//   const token = authHeader && authHeader.split(' ')[1]
//   if (token == null) return res.sendStatus(401) // if there isn't any token

//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err: any, user: any) => {
//     console.log(err)
//     if (err) return res.sendStatus(403)
//     req.user = user
//     next() // pass the execution off to whatever request the client intended
//   })
// }

function authenticateTokens(req, res, next) {

  let token = req.cookies.jwt

  if(!token){
    return res.status(403).send()
  }

  let payload;

  try{
    payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    next()
  }
  catch(e){
    return res.status(401).send()
  }
  
}

app.get('/', function(req, res){
  res.render('home');
});

app.get('/login', function(req, res){
  
  res.render('login');
});


app.post('/login', function(req, res){
  console.log(req.body)
  
  const username = req.body.username;
  const password = md5(req.body.password);

  User.findOne({email: username}, function(err, foundUser){
    
    if(err) {
      console.log(err);
      
    } else {
      if (foundUser) {
        if(foundUser.password === password) {
          console.log(foundUser);
          let payload = {username: foundUser._id}
          let token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_LIFE})
          
          res.cookie("jwt", token, {secure: true, httpOnly: true})
          
          res.send({ auth: true, token: token})
          
        } else {
          console.log("incorrect password")
        }

      }
    }
  })
});

app.route('/register')
  .get(function(req, res){
    res.render('register');
  })
  .post(function(req, res){
    const newUser = new User({
      email: req.body.username,
      password: md5(req.body.password)
    });

    newUser.save(function(err){
      if(err) {
        console.log(err);
        return res.status(500).send("There was a problem registering the user");
      } else {
        
        let payload = {username: newUser._id}
        let token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_LIFE})
        
        res.cookie("jwt", token, {secure: true, httpOnly: true})
        
        res.send({ auth: true, token: token})
        
        
      }
    });
  });

app.get('/secrets', authenticateTokens, function (req,res){
  res.render('secrets');
})



app.listen('3000', function(){
  console.log("server has started on port 3000")
});











