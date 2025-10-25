// server.js

require('dotenv').config();
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solar_install';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Session configuration (stored in MongoDB)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: { secure: false } // set true if using HTTPS
}));

/* ----------------------------
   Mongoose Schemas & Models
   ---------------------------- */
const { Schema, model, Types } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const formSubmissionSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: false }, // optional if anonymous
  userEmail: { type: String }, // keep email for quick access
  formType: { type: String, required: true },
  formData: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

const contactFormSchema = new Schema({
  fullName: String,
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const solarServiceSchema = new Schema({
  full_name: String,
  email: { type: String, index: true },
  phone: { type: String, index: true },
  service_type: String,
  service_details: String,
  street_address: String,
  street_address_line2: String,
  city: String,
  region: String,
  postal_code: String,
  createdAt: { type: Date, default: Date.now }
});

const solarCalculatorSchema = new Schema({
  panel_capacity: String,
  roof_area: String,
  budget: String,
  state: String,
  customer_category: String,
  electricity_cost: String,
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new Schema({
  message: String,
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = model('User', userSchema);
const FormSubmission = model('FormSubmission', formSubmissionSchema);
const ContactForm = model('ContactForm', contactFormSchema);
const SolarService = model('SolarService', solarServiceSchema);
const SolarCalculatorData = model('SolarCalculatorData', solarCalculatorSchema);
const Notification = model('Notification', notificationSchema);

/* ----------------------------
   Helper & Middleware
   ---------------------------- */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ success: false, error: 'Unauthorized' });
}

async function saveFormSubmission(userId, formType, formData, res) {
  try {
    const user = userId ? await User.findById(userId).lean() : null;
    const doc = new FormSubmission({
      user: user ? user._id : undefined,
      userEmail: user ? user.email : undefined,
      formType,
      formData
    });
    await doc.save();
    return res.json({ success: true, message: 'Form submitted and saved successfully.' });
  } catch (err) {
    console.error('Error saving form submission:', err);
    return res.status(500).send('Error saving form submission.');
  }
}

/* ----------------------------
   Routes (converted to Mongo)
   ---------------------------- */

// Home page: serve index.html from public
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, error: 'All fields are required' });

    // check duplicates by username or email
    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) return res.status(409).json({ success: false, error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    return res.json({ success: true, message: 'User registered successfully!' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, error: 'Error processing signup' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password are required' });

    const user = await User.findOne({ username }).exec();
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, error: 'Incorrect password' });

    req.session.user = { id: user._id.toString(), email: user.email };
    return res.json({ success: true, message: 'Login successful!' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Error processing login' });
  }
});

// Generic endpoint to handle form submission (requires session)
app.post('/submit', async (req, res) => {
  try {
    const { formType, formData } = req.body;
    const userEmail = req.session.user?.email;
    const userId = req.session.user?.id;

    if (!userEmail) return res.status(403).send('Unauthorized');

    // Here we save it as a FormSubmission document
    const doc = new FormSubmission({
      user: userId ? Types.ObjectId(userId) : undefined,
      userEmail,
      formType,
      formData
    });
    await doc.save();
    return res.send('Form submitted successfully.');
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).send('Error saving form submission.');
  }
});

// Account info
app.get('/account', (req, res) => {
  if (req.session.user) {
    res.json({ success: true, email: req.session.user.email });
  } else {
    res.json({ success: false, email: null });
  }
});

/* 
  Contact form route (original code required authentication)
  We'll keep it protected with isAuthenticated by default.
*/
app.post('/submit-contact', isAuthenticated, async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;
    console.log('Contact Form Submission Data:', req.body);

    if (!fullName || !email || !phone || !message) return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });

    // Duplicate check by email or phone
    const existing = await ContactForm.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existing) return res.status(409).json({ success: false, error: 'User already exists.' });

    const contact = new ContactForm({ fullName, email, phone, message });
    await contact.save();

    // Save a generic form submission too (optional)
    await new FormSubmission({ user: req.session.user.id, userEmail: req.session.user.email, formType: 'contact_form', formData: req.body }).save();

    console.log('Contact data inserted into MongoDB');
    res.json({ success: true, message: 'Contact form submission successful!' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ success: false, error: 'Error submitting contact form' });
  }
});

// Solar service submission (originally not protected; kept public here)
app.post('/submit-form', async (req, res) => {
  try {
    const {
      fullName, email, phone, serviceType, serviceDetails,
      streetAddress, streetAddressLine2, city, region, postalCode
    } = req.body;

    console.log('Form Submission Data:', req.body);

    if (!fullName || !email || !phone || !serviceType || !serviceDetails || !streetAddress || !city || !region || !postalCode) {
      return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
    }

    const existing = await SolarService.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existing) {
      // Matches previous behavior which returned 409 with a success message in original code
      return res.status(409).json({ success: false, error: 'Service Submitted Successfully' });
    }

    const doc = new SolarService({
      full_name: fullName,
      email,
      phone,
      service_type: serviceType,
      service_details: serviceDetails,
      street_address: streetAddress,
      street_address_line2: streetAddressLine2,
      city, region, postal_code: postalCode
    });
    await doc.save();

    // optional: store a FormSubmission record (user may be anonymous)
    await new FormSubmission({ formType: 'solar_services', formData: req.body, userEmail: email }).save();

    console.log('Data inserted into MongoDB');
    res.json({ success: true, message: 'Form submission successful!' });
  } catch (err) {
    console.error('Submit-form error:', err);
    return res.status(500).json({ success: false, message: 'Please wait till your previous requests gets accepted' });
  }
});

// Calculator submission
app.post('/submit-calculator', async (req, res) => {
  try {
    const { panelCapacity, roofArea, budget, state, customerCategory, electricityCost } = req.body;
    console.log('Calculator Form Data:', req.body);

    if (!panelCapacity || !roofArea || !budget || !state || !customerCategory || !electricityCost) {
      return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
    }

    // duplicate check by fields (mimicking original)
    const existing = await SolarCalculatorData.findOne({
      panel_capacity: panelCapacity,
      roof_area: roofArea,
      state: state
    }).lean();

    if (existing) {
      return res.status(409).json({ success: false, error: 'Requirement submitted successfully' });
    }

    const doc = new SolarCalculatorData({
      panel_capacity: panelCapacity,
      roof_area: roofArea,
      budget,
      state,
      customer_category: customerCategory,
      electricity_cost: electricityCost
    });
    await doc.save();

    await new FormSubmission({ formType: 'solar_calculator_data', formData: req.body }).save();

    console.log('Calculator data inserted into MongoDB');
    res.json({ success: true, message: 'Calculator data submission successful!' });
  } catch (err) {
    console.error('Calculator submit error:', err);
    res.status(500).json({ success: false, error: 'Error submitting calculator data' });
  }
});

/* Retrieval endpoints */
app.get('/get-all-services', async (req, res) => {
  try {
    const results = await SolarService.find().lean();
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error retrieving services:', err);
    res.status(500).json({ success: false, error: 'Error retrieving service data' });
  }
});

app.get('/get-contact-data', async (req, res) => {
  try {
    const results = await ContactForm.find().lean();
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error retrieving contact data:', err);
    res.status(500).json({ success: false, error: 'Error retrieving contact data' });
  }
});

app.get('/get-calculator-data', async (req, res) => {
  try {
    const results = await SolarCalculatorData.find().lean();
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error retrieving calculator data:', err);
    res.status(500).json({ success: false, error: 'Error retrieving calculator data' });
  }
});

app.get('/notifications', async (req, res) => {
  try {
    const results = await Notification.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, notifications: results });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: 'Error fetching notifications' });
  }
});

// fetch-solar-data by date (YYYY-MM-DD)
app.get('/fetch-solar-data', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date parameter is required.' });

    // create start and end for the selected day
    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const results = await SolarService.find({
      createdAt: { $gte: start, $lt: end }
    }, { _id: 1, service_type: 1, createdAt: 1 }).lean();

    // format timestamp similar to SQL DATE_FORMAT
    const mapped = results.map(r => ({
      id: r._id,
      serviceType: r.service_type,
      formatted_timestamp: r.createdAt.toISOString().replace('T', ' ').split('.')[0]
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching solar data:', err);
    res.status(500).json({ success: false, message: 'Error fetching solar data.' });
  }
});

/* 
  Duplicate route names in original code replaced by single handler versions above.
  If you intentionally had two /submit-form or /submit-contact endpoints,
  the later definitions in the file will take precedence (this file uses the converted ones).
*/

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
