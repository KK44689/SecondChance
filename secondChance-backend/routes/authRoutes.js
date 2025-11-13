const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();

        // Task 2: Access MongoDB `users` collection
        const collection = await db.collection('users');

        // Task 3: Check if user credentials already exists in the database and throw an error if they do
        const isUserExists = await collection.findOne({ email: req.body.email });
        if (isUserExists) {
            logger.error("Email id already exists");
            return res.status(400).json({ error: "Email id already exists" });
        }

        // Task 4: Create a hash to encrypt the password so that it is not readable in the database
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);

        // Task 5: Insert the user into the database
        const user = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = {
            user: {
                id: user.insertedId
            },
        };

        const authToken = jwt.sign(payload, JWT_SECRET);
        // Task 7: Log the successful registration using the logger
        logger.info("User registered successfully");

        // Task 8: Return the user email and the token as a JSON
        return res.json({ email: user.email, token: authToken });
    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();

        // Task 2: Access MongoDB `users` collection
        const collection = await db.collection('users');

        // Task 3: Check for user credentials in database
        const user = await collection.findOne({ email: req.body.email });
        console.log(req.body.email);
        console.log(user);
        if (!user) {
            logger.error("User not exists.");
            return res.status(404).json({ error: "User not exists." })
        }

        // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch
        const result = await bcrypt.compare(req.body.password, user.password);
        if (!result) {
            logger.error("Password not matched.");
            return res.status(404).json({ error: "Wrong password." });
        }

        // Task 5: Fetch user details from a database
        const userName = user.firstName;

        // Task 6: Create JWT authentication if passwords match with user._id as payload
        let payload = {
            user: {
                id: user._id.toString()
            },
        };
        jwt.sign(user._id, JWT_SECRET);

        res.json({ authtoken, userName, userEmail });
        // Task 7: Send appropriate message if the user is not found
    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;