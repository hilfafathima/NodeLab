const express = require('express');
const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');

const app = express();
const PORT = 3000;

// File paths
const usersFile = path.join(__dirname, 'users.json');
const auditFile = path.join(__dirname, 'audit.log');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// USER FILE HELPER FUNCTIONS
// ==========================================

// Read users from users.json
function readUsers() {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
}

// Save users to users.json
function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2),
        'utf-8'
    );
}

// ==========================================
// NODE.JS EVENT SYSTEM
// ==========================================

const userEvents = new EventEmitter();

// Signup event listener
userEvents.on('signup', (user) => {
    const timestamp = new Date().toISOString();

    const message =
        `[${timestamp}] User signed up: ${user.email}\n`;

    fs.appendFileSync(auditFile, message, 'utf-8');

    console.log('Signup event recorded.');
});

// Login event listener
userEvents.on('login', (user) => {
    const timestamp = new Date().toISOString();

    const message =
        `[${timestamp}] User logged in: ${user.email}\n`;

    fs.appendFileSync(auditFile, message, 'utf-8');

    console.log('Login event recorded.');
});

// ==========================================
// SIGN UP ROUTE
// ==========================================

app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    // Check that all fields are provided
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all fields.'
        });
    }

    const users = readUsers();

    // Check whether email already exists
    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered.'
        });
    }

    // Create new user
    const newUser = {
        name: name,
        email: email,
        password: password
    };

    // Add user to array
    users.push(newUser);

    // Save updated users
    saveUsers(users);

    // Emit signup event
    userEvents.emit('signup', newUser);

    res.json({
        success: true,
        message: 'Registration successful!'
    });
});

// ==========================================
// LOGIN ROUTE
// ==========================================

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check that fields are provided
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please enter email and password.'
        });
    }

    const users = readUsers();

    // Find matching user
    const user = users.find(
        user =>
            user.email === email &&
            user.password === password
    );

    // Invalid login
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password.'
        });
    }

    // Emit login event
    userEvents.emit('login', user);

    res.json({
        success: true,
        message: 'Login successful!',
        name: user.name
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});