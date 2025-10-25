const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'meera@1213',
    database: 'solar_install'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

// Route for the home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Helper function to save form submission data with foreign key
function saveFormSubmission(userId, formType, formData, res) {
    const sql = 'INSERT INTO form_submissions (user_id, form_type, form_data) VALUES (?, ?, ?)';
    db.query(sql, [userId, formType, JSON.stringify(formData)], (err) => {
        if (err) {
            console.error('Error saving form submission:', err);
            return res.status(500).send('Error saving form submission.');
        }
        res.send('Form submitted and saved successfully.');
    });
}

// Signup route
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ success: false, error: 'Error processing signup' });
        }

        const checkSql = 'SELECT * FROM users WHERE email = ? OR username = ?';
        db.query(checkSql, [email, username], (err, results) => {
            if (err) {
                console.error('Error checking duplicates:', err);
                return res.status(500).json({ success: false, error: 'Error processing signup' });
            }

            if (results.length > 0) {
                return res.status(409).json({ success: false, error: 'User already exists' });
            }

            const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
            db.query(sql, [username, email, hashedPassword], (err) => {
                if (err) {
                    console.error('Error inserting user data:', err);
                    return res.status(500).json({ success: false, error: 'Error processing signup' });
                }
                res.json({ success: true, message: 'User registered successfully!' });
            });
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).json({ success: false, error: 'Error processing login' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Error comparing password:', err);
                return res.status(500).json({ success: false, error: 'Error processing login' });
            }

            if (!match) {
                return res.status(401).json({ success: false, error: 'Incorrect password' });
            }

            req.session.user = { id: user.id, email: user.email };
            res.json({ success: true, message: 'Login successful!' });
        });
    });
});


// Endpoint to handle form submissions
app.post('/submit', (req, res) => {
    const { formType, formData } = req.body; // Get the form type and data
    const userEmail = req.session.user?.email;

    if (!userEmail) {
        return res.status(403).send('Unauthorized');
    }

    db.query('INSERT INTO form_submissions (user_email, form_type, form_data) VALUES (?, ?, ?)', [userEmail, formType, formData], (err) => {
        if (err) return res.status(500).send('Error saving form submission.');
        res.send('Form submitted successfully.');
    });
});
// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized' });
}

// Account route to get logged-in user details
app.get('/account', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, email: req.session.user.email });
    } else {
        res.json({ success: false, email: null });
    }
});

// Route for contact form submission with duplicate check
app.post('/submit-contact', isAuthenticated, (req, res) => {
    const { fullName, email, phone, message } = req.body;

    console.log('Contact Form Submission Data:', req.body);

    if (!fullName || !email || !phone || !message) {
        return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
    }

    const checkSql = 'SELECT * FROM contact_form WHERE email = ? OR phone = ?';
    db.query(checkSql, [email, phone], (err, results) => {
        if (err) {
            console.error('Error checking duplicates:', err);
            return res.status(500).json({ success: false, error: 'Error processing contact form' });
        }
        
        if (results.length > 0) {
            return res.status(409).json({ success: false, error: 'User already exists.' });
        }

        // Insert if no duplicates found
        const sql = 'INSERT INTO contact_form (Name, email, phone, message) VALUES (?, ?, ?, ?)';
        db.query(sql, [fullName, email, phone, message], (err, result) => {
            if (err) {
                console.error('Error inserting contact data:', err);
                return res.status(500).json({ success: false, error: 'Error submitting contact form' });
            }
            console.log('Contact data inserted into MySQL:', result);
            res.json({ success: true, message: 'Contact form submission successful!' });
        });
    });
});
// Route for solar service form submission with duplicate check
app.post('/submit-form', (req, res) => {
    const { fullName, email, phone, serviceType, serviceDetails, streetAddress, streetAddressLine2, city, region, postalCode } = req.body;

    console.log('Form Submission Data:', req.body);

    if (!fullName || !email || !phone || !serviceType || !serviceDetails || !streetAddress || !city || !region || !postalCode) {
        return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
    }

    const checkSql = 'SELECT * FROM solar_services WHERE email = ? OR phone = ?';
    db.query(checkSql, [email, phone], (err, results) => {
        if (err) {
            console.error('Error checking duplicates:', err);
            return res.status(500).json({ success: false, error: 'Error processing service form' });
        }

        if (results.length > 0) {
            return res.status(409).json({ success: false, error: 'Service Submitted Successfully' });
        }

        // Insert if no duplicates found
        const sql = 'INSERT INTO solar_services (full_name, email, phone, service_type, service_details, street_address, street_address_line2, city, region, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [fullName, email, phone, serviceType, serviceDetails, streetAddress, streetAddressLine2, city, region, postalCode], (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ success: false, message:'Please wait till your previous requests gets accepted' });
            }
            console.log('Data inserted into MySQL:', result);
            res.json({ success: true, message: 'Form submission successful!' });
        });
    });
});

// Route for calculator form submission with duplicate check
app.post('/submit-calculator', (req, res) => {
    const { panelCapacity, roofArea, budget, state, customerCategory, electricityCost } = req.body;

    console.log('Calculator Form Data:', req.body);

    if (!panelCapacity || !roofArea || !budget || !state || !customerCategory || !electricityCost) {
        return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
    }

    const checkSql = 'SELECT * FROM solar_calculator_data WHERE panel_capacity = ? AND roof_area = ? AND state = ?';
    db.query(checkSql, [panelCapacity, roofArea, state], (err, results) => {
        if (err) {
            console.error('Error checking duplicates:', err);
            return res.status(500).json({ success: false, error: 'Error processing calculator data' });
        }

        if (results.length > 0) {
            return res.status(409).json({ success: false, error: 'Requirement submitted successfully' });
        }

        // Insert if no duplicates found
        const sql = 'INSERT INTO solar_calculator_data(panel_capacity, roof_area, budget, state, customer_category, electricity_cost) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [panelCapacity, roofArea, budget, state, customerCategory, electricityCost], (err, result) => {
            if (err) {
                console.error('Error inserting calculator data:', err);
                return res.status(500).json({ success: false, error: 'Error submitting calculator data' });
            }
            console.log('Calculator data inserted into MySQL:', result);
            res.json({ success: true, message: 'Calculator data submission successful!' });
        });
    });
});

// Routes to retrieve data
app.get('/get-all-services', (req, res) => {
    const sql = 'SELECT * FROM solar_services';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving data:', err);
            return res.status(500).json({ success: false, error: 'Error retrieving service data' });
        }
        res.json({ success: true, data: results });
    });
});

app.get('/get-contact-data', (req, res) => {
    const sql = 'SELECT * FROM contact_form';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving data:', err);
            return res.status(500).json({ success: false, error: 'Error retrieving contact data' });
        }
        res.json({ success: true, data: results });
    });
});

app.get('/get-calculator-data', (req, res) => {
    const sql = 'SELECT * FROM solar_calculator_data';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving data:', err);
            return res.status(500).json({ success: false, error: 'Error retrieving calculator data' });
        }
        res.json({ success: true, data: results });
    });
});

// Route to fetch notifications
app.get('/notifications', (req, res) => {
    const query = 'SELECT message, created_at FROM notifications ORDER BY created_at DESC';
    db.query(query, (error, results) => {
        if (error) {
            res.status(500).json({ success: false, error: 'Error fetching notifications' });
        } else {
            res.json({ success: true, notifications: results });
        }
    });
});


// Endpoint to handle form submissions
app.post('/submit-form', isAuthenticated, (req, res) => {
    const formData = req.body;
    const formType = 'solar_services';
    const userId = req.session.user.id;
    saveFormSubmission(userId, formType, formData, res);
});

// Route for contact form submission with duplicate check
app.post('/submit-contact', isAuthenticated, (req, res) => {
    const formData = req.body;
    const formType = 'contact_form';
    const userId = req.session.user.id;
    saveFormSubmission(userId, formType, formData, res);
});

// Route for solar calculator form submission with duplicate check
app.post('/submit-calculator', isAuthenticated, (req, res) => {
    const formData = req.body;
    const formType = 'solar_calculator_data';
    const userId = req.session.user.id;
    saveFormSubmission(userId, formType, formData, res);
});
// Route to fetch solar data
app.get('/fetch-solar-data', (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ success: false, message: 'Date parameter is required.' });
    }

    const sql = `SELECT id, service_type AS serviceType, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS formatted_timestamp 
                 FROM solar_services 
                 WHERE DATE(created_at) = ?`; // Updated to use created_at

    db.query(sql, [date], (err, results) => {
        if (err) {
            console.error('Error fetching solar data:', err);
            return res.status(500).json({ success: false, message: 'Error fetching solar data.' });
        }
        res.json(results);
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
