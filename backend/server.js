//p1=phase1, p2=phase2, p3=phase3
// VERY IMPORTANT: This block fixed the mognoDB connection issue  
const dns = require("dns");
//change DNS
dns.setServers(["1.1.1.1","8.8.8.8"]);


//Importing necessary modules(p1)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// For Google OAuth (p2)
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

//************************************************************

//app setup(p1)
const app = express();
app.use(cors());
app.use(express.json());

// For sessions and authentication (p2)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//*********************************************************** 

//Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('DB error:', err));

//************************************************************ 

//MODEL SCHEMAS
//Updated todo model schema (p2) - added owner field to link todos to users
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Todo = mongoose.model('Todo', todoSchema);

//user model schema (p2)
const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
  photo: String
});

const User = mongoose.model('User', userSchema);

//configuring passport for Google OAuth (p2)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      photo: profile.photos[0].value
    });
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

//******************************************************** */

// Middleware to protect routes (p2)
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

//*************************************************************** */

//API routes
//Updated API routes with authentication (p2)
// GET all todos - only return todos belonging to logged in user
app.get('/api/todos', requireAuth, async (req, res) => {
  // find only todos where owner matches the logged in user's id
  const todos = await Todo.find({ owner: req.user.id });
  res.json(todos);
});

// POST create a todo - attach logged in user as owner
app.post('/api/todos', requireAuth, async (req, res) => {
  // save the todo with owner set to logged in user's id
  const todo = new Todo({ text: req.body.text, owner: req.user.id });
  await todo.save();
  res.status(201).json(todo);
});

// PATCH toggle completed - only allow if todo belongs to logged in user
app.patch('/api/todos/:id', requireAuth, async (req, res) => {
  // findOne checks both the id AND the owner - prevents one user editing another's todo
  const todo = await Todo.findOne({ _id: req.params.id, owner: req.user.id });
  todo.completed = !todo.completed;
  await todo.save();
  res.json(todo);
});

// DELETE a todo - only allow if todo belongs to logged in user
app.delete('/api/todos/:id', requireAuth, async (req, res) => {
  // same pattern - checks id AND owner before deleting
  await Todo.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  res.json({ message: 'Deleted' });
});

//Auth routes for Google OAuth (p2)
// Start Google login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google calls this after login
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, name: req.user.name, email: req.user.email, photo: req.user.photo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${process.env.FRONTEND_URL}/index.html?token=${token}`);
  }
);




//***************************************************************

//starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));