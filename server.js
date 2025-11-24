// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// ================= DATABASE CONNECTION =================
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Nitian@2526',
  database: 'recipe_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// ================= MIDDLEWARE =================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: false
}));

// Make session accessible inside EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Protect Routes Middleware
function isLoggedIn(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// ================= AUTH ROUTES =================

// Register Page
app.get('/register', (req, res) => {
  res.render('register');
});

// Handle Registration
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;

  db.query(query, [username, email, hashedPassword], (err) => {
    if (err) return res.send("Error creating user: " + err.message);
    res.redirect('/login');
  });
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Handle Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) return res.send("Error: " + err.message);
    if (results.length === 0) return res.send("User not found");

    const user = results[0];

    if (bcrypt.compareSync(password, user.password)) {
      req.session.userId = user.id;
      req.session.username = user.username;
      return res.redirect('/dashboard');
    }

    res.send("Incorrect password");
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ================= DASHBOARD =================
app.get('/dashboard', isLoggedIn, (req, res) => {
  const userId = req.session.userId;

  const query = "SELECT * FROM recipes WHERE user_id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send("Error loading dashboard");

    res.render('dashboard', {
      username: req.session.username,
      myRecipes: results
    });
  });
});

// ================= RECIPE ROUTES =================

// Home - only show user's recipes + default recipes
app.get('/', isLoggedIn, (req, res) => {
  const userId = req.session.userId;

  const query = `
    SELECT * FROM recipes 
    WHERE is_default = 1 OR user_id = ?
    ORDER BY is_default DESC, created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send('Error fetching recipes');

    const defaultRecipes = results.filter(r => r.is_default === 1);
    const userRecipes = results.filter(r => r.user_id === userId);

    res.render('index', {
      defaultRecipes,
      userRecipes
    });
  });
});

// Add Recipe Page
app.get('/add', isLoggedIn, (req, res) => {
  res.render('add');
});

// Insert Recipe (save with user_id)
app.post('/add', isLoggedIn, (req, res) => {
  const { name, category, ingredients, instructions, prep_time, cook_time, servings } = req.body;

  const query = `
    INSERT INTO recipes 
    (name, category, ingredients, instructions, prep_time, cook_time, servings, is_default, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)
  `;

  const values = [
    name,
    category || null,
    ingredients,
    instructions,
    prep_time ? parseInt(prep_time) : null,
    cook_time ? parseInt(cook_time) : null,
    servings ? parseInt(servings) : null,
    req.session.userId
  ];

  db.query(query, values, (err) => {
    if (err) return res.status(500).send("Database Error: " + err.message);
    res.redirect('/dashboard');
  });
});

// View Single Recipe (only if user's or default)
app.get('/recipe/:id', isLoggedIn, (req, res) => {
  const recipeId = req.params.id;
  const userId = req.session.userId;

  const query = `
    SELECT * FROM recipes 
    WHERE id = ? AND (is_default = 1 OR user_id = ?)
  `;

  db.query(query, [recipeId, userId], (err, results) => {
    if (err) return res.status(500).send("Error fetching recipe");

    if (results.length === 0) {
      return res.send("❌ Access Denied: This recipe does not belong to you.");
    }

    res.render('recipe', { recipe: results[0] });
  });
});

// Delete Recipe (only if created by user)
app.post('/delete/:id', isLoggedIn, (req, res) => {
  const recipeId = req.params.id;
  const userId = req.session.userId;

  const query = `
    DELETE FROM recipes 
    WHERE id = ? AND user_id = ?
  `;

  db.query(query, [recipeId, userId], (err, result) => {
    if (err) return res.status(500).send("Error deleting recipe");

    if (result.affectedRows === 0) {
      return res.send("❌ You cannot delete someone else's recipe!");
    }

    res.redirect('/dashboard');
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
