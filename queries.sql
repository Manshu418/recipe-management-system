/* =========================================================
   DATABASE
   ========================================================= */
CREATE DATABASE IF NOT EXISTS recipe_db;
USE recipe_db;


/* =========================================================
   MASTER TABLES (NO FOREIGN KEYS)
   ========================================================= */

/* USERS */
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* CATEGORIES */
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

/* UNITS */
CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_name VARCHAR(50) NOT NULL,
    unit_symbol VARCHAR(10)
);


/* =========================================================
   MAIN TABLE
   ========================================================= */

/* RECIPES */
CREATE TABLE recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    prep_time INT,
    cook_time INT,
    servings INT,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    category_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);


/* =========================================================
   DEPENDENT TABLES
   ========================================================= */

/* INGREDIENTS */
CREATE TABLE ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    ingredient_name VARCHAR(255),
    quantity VARCHAR(50),
    unit_id INT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

/* INSTRUCTIONS */
CREATE TABLE instructions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    step_number INT NOT NULL,
    step_text TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

/* RECIPE IMAGES (OPTIONAL – NOT USED NOW) */
CREATE TABLE recipe_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    image_path VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);


/* =========================================================
   INSERT MASTER DATA
   ========================================================= */

/* CATEGORIES */
INSERT INTO categories (id, name) VALUES
(1, 'Breakfast'),
(2, 'Lunch'),
(3, 'Dinner'),
(4, 'Dessert'),
(5, 'Salad'),
(6, 'Snack');

/* UNITS */
DELETE FROM units;
INSERT INTO units (id, unit_name, unit_symbol) VALUES
(1, 'cup', 'cup'),
(2, 'tablespoon', 'tbsp'),
(3, 'teaspoon', 'tsp'),
(4, 'piece', 'pc'),
(5, 'gram', 'g'),
(6, 'milliliter', 'ml'),
(7, 'clove/pinch', NULL);


/* =========================================================
   DEFAULT RECIPES
   ========================================================= */

/* RECIPE 1: CLASSIC PANCAKES */
INSERT INTO recipes
(id, name, category_id, prep_time, cook_time, servings, is_default, user_id)
VALUES
(1, 'Classic Pancakes', 1, 10, 15, 4, 1, NULL);

/* INGREDIENTS – PANCAKES */
INSERT INTO ingredients (recipe_id, ingredient_name, quantity, unit_id) VALUES
(1, 'All-purpose flour', '1 1/2', 1),
(1, 'Baking powder', '3 1/2', 3),
(1, 'Salt', '1', 3),
(1, 'White sugar', '1', 2),
(1, 'Milk', '1 1/4', 1),
(1, 'Egg', '1', 4),
(1, 'Butter, melted', '3', 2);

/* INSTRUCTIONS – PANCAKES */
INSERT INTO instructions (recipe_id, step_number, step_text) VALUES
(1, 1, 'Sift together the flour, baking powder, salt and sugar.'),
(1, 2, 'Make a well in the center and pour in the milk, egg and melted butter.'),
(1, 3, 'Mix until smooth.'),
(1, 4, 'Heat a lightly oiled griddle over medium-high heat.'),
(1, 5, 'Pour 1/4 cup batter for each pancake.'),
(1, 6, 'Brown on both sides and serve hot.');


/* RECIPE 2: GRILLED CHEESE SANDWICH */
INSERT INTO recipes
(id, name, category_id, prep_time, cook_time, servings, is_default, user_id)
VALUES
(2, 'Grilled Cheese Sandwich', 6, 5, 8, 1, 1, NULL);

/* INGREDIENTS – GRILLED CHEESE */
INSERT INTO ingredients (recipe_id, ingredient_name, quantity, unit_id) VALUES
(2, 'Bread slices', '2', 4),
(2, 'Cheddar cheese slices', '2', 4),
(2, 'Butter', '2', 2);

/* INSTRUCTIONS – GRILLED CHEESE */
INSERT INTO instructions (recipe_id, step_number, step_text) VALUES
(2, 1, 'Heat skillet over medium heat.'),
(2, 2, 'Butter bread slices.'),
(2, 3, 'Place cheese between slices.'),
(2, 4, 'Cook until golden brown.'),
(2, 5, 'Flip and toast other side.');



-- RECIPE 3: SPAGHETTI BOLOGNESE
INSERT INTO recipes
(id, name, category_id, prep_time, cook_time, servings, is_default, user_id)
VALUES
(3, 'Spaghetti Bolognese', 3, 15, 35, 4, 1, NULL);

INSERT INTO ingredients (recipe_id, ingredient_name, quantity, unit_id) VALUES
(3, 'Spaghetti', '400', 5),
(3, 'Ground beef', '500', 5),
(3, 'Onion, diced', '1', 4),
(3, 'Garlic, minced', '2 cloves', 7),
(3, 'Canned tomatoes', '400', 5),
(3, 'Tomato paste', '2', 2),
(3, 'Dried oregano', '1', 3),
(3, 'Salt & pepper', NULL, 7),
(3, 'Olive oil', NULL, 7);

INSERT INTO instructions (recipe_id, step_number, step_text) VALUES
(3, 1, 'Cook spaghetti according to package instructions.'),
(3, 2, 'Heat oil and sauté onion and garlic.'),
(3, 3, 'Add ground beef and cook until browned.'),
(3, 4, 'Add tomatoes, paste, and seasoning.'),
(3, 5, 'Simmer sauce and serve over spaghetti.');



-- RECIPE 4: CAESAR SALAD

INSERT INTO recipes
(id, name, category_id, prep_time, cook_time, servings, is_default, user_id)
VALUES
(4, 'Caesar Salad', 5, 15, 0, 4, 1, NULL);

INSERT INTO ingredients (recipe_id, ingredient_name, quantity, unit_id) VALUES
(4, 'Romaine lettuce', '1', 4),
(4, 'Caesar dressing', '1/2', 1),
(4, 'Parmesan cheese', '1/2', 1),
(4, 'Croutons', '1', 1),
(4, 'Garlic', '2 cloves', 7),
(4, 'Lemon juice', '1/4', 1),
(4, 'Dijon mustard', '2', 3),
(4, 'Anchovy fillets', '2', 4),
(4, 'Olive oil', '1/2', 1);

INSERT INTO instructions (recipe_id, step_number, step_text) VALUES
(4, 1, 'Wash and chop romaine lettuce.'),
(4, 2, 'Prepare dressing by mixing ingredients.'),
(4, 3, 'Toss lettuce with dressing.'),
(4, 4, 'Top with croutons and parmesan.');



-- RECIPE 5: CHOCOLATE CHIP COOKIES

INSERT INTO recipes
(id, name, category_id, prep_time, cook_time, servings, is_default, user_id)
VALUES
(5, 'Chocolate Chip Cookies', 4, 15, 11, 48, 1, NULL);

INSERT INTO ingredients (recipe_id, ingredient_name, quantity, unit_id) VALUES
(5, 'All-purpose flour', '2 1/4', 1),
(5, 'Baking soda', '1', 3),
(5, 'Salt', '1', 3),
(5, 'Butter, softened', '1', 2),
(5, 'White sugar', '3/4', 1),
(5, 'Brown sugar', '3/4', 1),
(5, 'Eggs', '2', 4),
(5, 'Vanilla extract', '2', 2),
(5, 'Chocolate chips', '2', 1);

INSERT INTO instructions (recipe_id, step_number, step_text) VALUES
(5, 1, 'Preheat oven to 350°F.'),
(5, 2, 'Mix dry ingredients.'),
(5, 3, 'Cream butter and sugars.'),
(5, 4, 'Add eggs and vanilla.'),
(5, 5, 'Fold in chocolate chips and bake.');


-- RECIPE 6: VEGETABLE STIR FRY

INSERT INTO recipes
(id, name, category_id, prep_time, cook_time, servings, is_default, user_id)
VALUES
(6, 'Vegetable Stir Fry', 3, 15, 10, 4, 1, NULL);

INSERT INTO ingredients (recipe_id, ingredient_name, quantity, unit_id) VALUES
(6, 'Broccoli', NULL, 7),
(6, 'Carrots', NULL, 7),
(6, 'Bell peppers', NULL, 7),
(6, 'Snap peas', NULL, 7),
(6, 'Vegetable oil', '2', 2),
(6, 'Garlic', '2 cloves', 7),
(6, 'Ginger', '1', 2),
(6, 'Soy sauce', '3', 2),
(6, 'Sesame oil', '1', 2),
(6, 'Cornstarch', '1', 3);

INSERT INTO instructions (recipe_id, step_number, step_text) VALUES
(6, 1, 'Prepare and chop vegetables.'),
(6, 2, 'Mix soy sauce, sesame oil, cornstarch.'),
(6, 3, 'Heat oil in wok.'),
(6, 4, 'Add garlic and ginger.'),
(6, 5, 'Stir fry vegetables and add sauce.');
