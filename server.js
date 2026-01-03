// server.js (FINAL UPDATED & FIXED)
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// ================= DATABASE =================
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Nitian@2526',
  database: 'recipe_db'
});

db.connect(err => {
  if (err) return console.error('DB Error:', err);
  console.log('Connected to MySQL');
});

// ================= MIDDLEWARE =================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
  session({
    secret: 'mySecretKey123',
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function isLoggedIn(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// ================= AUTH ROUTES =================
app.get('/register', (req, res) => res.render('register'));

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.send('Please fill all fields.');

  const hashed = bcrypt.hashSync(password, 10);

  db.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashed],
    err => {
      if (err) return res.send('Error: ' + err.message);
      res.redirect('/login');
    }
  );
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) return res.send('Error: ' + err.message);
    if (rows.length === 0) return res.send('User not found');

    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password))
      return res.send('Incorrect password');

    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect('/');
  });
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// ================= DASHBOARD =================
app.get('/dashboard', isLoggedIn, (req, res) => {
  const userId = req.session.userId;

  const q = `
    SELECT r.id, r.name,
           COALESCE(c.name, r.category) AS category_name,
           r.prep_time, r.cook_time, r.servings, r.created_at
    FROM recipes r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(q, [userId], (err, rows) => {
    if (err) return res.send('DB Error');
    res.render('dashboard', { username: req.session.username, myRecipes: rows });
  });
});

// ================= HOME PAGE =================
app.get('/', isLoggedIn, (req, res) => {
  const userId = req.session.userId;

  const q = `
    SELECT r.*, COALESCE(c.name, r.category) AS category_name
    FROM recipes r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.is_default = 1 OR r.user_id = ?
    ORDER BY r.is_default DESC, r.created_at DESC
  `;

  db.query(q, [userId], (err, rows) => {
    if (err) return res.send('DB Error');

    const defaultRecipes = rows.filter(r => r.is_default === 1);
    const userRecipes = rows.filter(r => r.user_id === userId);

    res.render('index', { defaultRecipes, userRecipes });
  });
});

// ================= ADD RECIPE =================
app.get('/add', isLoggedIn, (req, res) => {
  db.query('SELECT * FROM units ORDER BY unit_name', (err1, units) => {
    if (err1) return res.send('DB Error');

    db.query('SELECT * FROM categories ORDER BY name', (err2, categories) => {
      if (err2) return res.send('DB Error');

      res.render('add', { units, categories });
    });
  });
});

app.post('/add', isLoggedIn, (req, res) => {
  const {
    name,
    category_id,
    category_text,
    ingredient_name,
    quantity,
    unit_id,
    step_text,
    prep_time,
    cook_time,
    servings
  } = req.body;

  const userId = req.session.userId;

  const insertRecipe = `
    INSERT INTO recipes (name, category_id, category, prep_time, cook_time, servings, is_default, user_id)
    VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)
  `;

  const recVals = [
    name,
    category_id || null,
    category_id ? null : category_text || null,
    prep_time || null,
    cook_time || null,
    servings || null,
    userId
  ];

  db.query(insertRecipe, recVals, (err, res1) => {
    if (err) return res.send('Error adding recipe');

    const recipeId = res1.insertId;

    // ---- INSERT INGREDIENTS ----
    const names = Array.isArray(ingredient_name) ? ingredient_name : [ingredient_name];
    const qtys = Array.isArray(quantity) ? quantity : [quantity];
    const units = Array.isArray(unit_id) ? unit_id : [unit_id];

    const ingRows = [];
    for (let i = 0; i < names.length; i++) {
      if (names[i].trim() !== '') {
        ingRows.push([recipeId, names[i], qtys[i] || null, units[i] || null]);
      }
    }

    if (ingRows.length > 0) {
      db.query(
        'INSERT INTO ingredients (recipe_id, ingredient_name, quantity, unit_id) VALUES ?',
        [ingRows]
      );
    }

    // ---- INSERT INSTRUCTIONS ----
    const steps = Array.isArray(step_text) ? step_text : [step_text];

    const stepRows = steps
      .map((text, index) => [recipeId, index + 1, text])
      .filter(x => x[2] && x[2].trim() !== '');

    if (stepRows.length > 0) {
      db.query(
        'INSERT INTO instructions (recipe_id, step_number, step_text) VALUES ?',
        [stepRows]
      );
    }

    res.redirect('/dashboard');
  });
});

// ================= VIEW RECIPE =================
app.get('/recipe/:id', isLoggedIn, (req, res) => {
  const recipeId = req.params.id;
  const userId = req.session.userId;

  const q1 = `
    SELECT r.*, COALESCE(c.name, r.category) AS category_name
    FROM recipes r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.id = ? AND (r.is_default = 1 OR r.user_id = ?)
  `;

  db.query(q1, [recipeId, userId], (err, recipeResult) => {
    if (err || recipeResult.length === 0)
      return res.send("Access denied or recipe not found");

    const recipe = recipeResult[0];

    // ⭐ FIXED INGREDIENT QUERY
    const ingredientQuery = `
      SELECT 
        i.id,
        i.ingredient_name,
        i.quantity,
        u.unit_name
      FROM ingredients i
      LEFT JOIN units u ON i.unit_id = u.id
      WHERE i.recipe_id = ?
    `;

    db.query(ingredientQuery, [recipeId], (err1, ingredients) => {
      if (err1) ingredients = [];

      const instructionQuery = `
        SELECT * FROM instructions 
        WHERE recipe_id = ? 
        ORDER BY step_number
      `;

      db.query(instructionQuery, [recipeId], (err2, instructions) => {
        if (err2) instructions = [];

        res.render('recipe', {
          recipe,
          ingredients,
          instructions
        });
      });
    });
  });
});


// ================= DELETE =================
app.post('/delete/:id', isLoggedIn, (req, res) => {
  const recipeId = req.params.id;
  const userId = req.session.userId;

  db.query(
    'DELETE FROM recipes WHERE id = ? AND user_id = ?',
    [recipeId, userId],
    (err, result) => {
      if (err) return res.send('DB Error');

      if (result.affectedRows === 0)
        return res.send('❌ You cannot delete this recipe');

      res.redirect('/');
    }
  );
});


// ================= START =================
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
