const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();


// CORS Configuration (IMPORTANT)
app.use(cors({
    origin: [
        "http://localhost:5173", // local development
        "https://codeconnect-frontend.vercel.app" // your Vercel frontend
    ],
    credentials: true
}));


// Middleware
app.use(express.json());


// Basic Route
app.get('/', (req, res) => {
    res.send('CodeConnect API is running');
});


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/profile', require('./routes/profiles'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/notifications', require('./routes/notifications'));


// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// Start server
const PORT = process.env.PORT || 5000;

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error(err);
        }
    });
};

startServer(PORT);