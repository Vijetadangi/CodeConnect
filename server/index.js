const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv to load from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

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


app.use('/uploads', express.static(path.join(__dirname, '/uploads')));




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
