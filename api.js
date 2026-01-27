const express = require('express');
require('dotenv').config();
const db = require('./db'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
// Middleware to parse JSON bodies
app.use(express.json());
// midleware to authorize requests
const  authorize = (req, res, next)=>{
    const userRole = req.user.role; // assuming req.user is set after authentication
    if (userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin only." });
        
    }
    next();
    
}

// authentication middleware
const  authenticate = (req, res, next)=>{
const   authHeader  =  req.headers.authorization;
if(!authHeader){
  return res.status(401).json({message: "no token  prvided"})
}

// this  is  a  pen  = split(' ') => [this, is, a, pen] 
const  token  =  authHeader.split(" ")[1] //  turn in to array and  take   value in  second  index
jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
  if(err){
    return res.status(401).json({message: "invalid  token"});
  }
  req.user = user; 
  next();
})

}

// Sample route
app.get('/home',authenticate,(req, res) => {
    res.send('Welcome to the Home Page');
});

// User registration
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).send('All fields are required');

    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)';
    db.query(query, [name, email, hashedPassword, role], (err, result) => {
        if (err) {
            console.log("Error registering user:", err);
            return res.status(500).send('Error registering user', err);
        }
        res.status(201).send('User registered successfully');
    });
});

// User login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email=?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.log("Error during login:", err);
            return res.status(500).send('Error during login', err);
        }

        if (results.length === 0) {
            return res.status(400).send('User not found');
        }

        const user = results[0];

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).send('Invalid password');
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id,
                 role: user.role, 
                 name: user.name,
                  email: user.email 
                },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
//Send token
        res.status(200).json({ token });
    });
});

// ------------------
// Sending data manually (optional)
// ------------------
app.post('/send', (req, res) => {
    const { name, email, password, role, created_at } = req.body;

    // Hash password before storing
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.log("Error hashing password:", err);
            return res.status(500).send('Error processing data');
        }

        const query = 'INSERT INTO users (name, email, password, role, created_at) VALUES (?,?,?,?,?)';
        db.query(query, [name, email, hashedPassword, role, created_at], (err, result) => {
            if (err) {
                console.log("Error inserting data:", err);
                return res.status(500).send('Error inserting data');
            }
            res.status(200).send('Data inserted successfully');
        });
    });
});

// ------------------
// Get all users
// ------------------
app.get('/users', (req, res) => {
    const query = 'SELECT id, name, email, role, created_at FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.log("Error fetching data:", err);
            return res.status(500).send('Error fetching data');
        }
        res.status(200).json(results);
    });
});

// ------------------
//create announcement endpoint
// ------------------
app.post('/announcements',authenticate, (req, res) => {
    const { title, message} = req.body;
    const userid= req.user.id;


    const query = 'INSERT INTO announcements (title, message,created_by) VALUES (?, ?,?)';
    db.query(query, [title, message,userid], (err, result) => {
        if (err) {
            console.log("Error inserting announcement:", err);
            return res.status(500).send('Error inserting announcement');
        }
        res.status(201).send('Announcement created successfully');
    });
});
// ------------------
// Get all announcements    
app.get('/announcements',(req, res) => {
    const query = 'SELECT a.id, a.title, a.message, a.created_at, u.name as created_by FROM announcements a JOIN users u ON a.created_by = u.id';
    db.query(query, (err, results) => {
        if (err) {
            console.log("Error fetching announcements:", err);
            return res.status(500).send('Error fetching announcements');
        }
        res.status(200).json(results);
    });
});
// ------------------
//update announcement endpoint
app.put('/announcements/:id',authenticate, (req, res) => {
    const announcementId = req.params.id;
    const { title, message } = req.body;
    const query = 'UPDATE announcements SET title = ?, message = ? WHERE id = ?';
    db.query(query, [title, message, announcementId], (err, result) => {
        if (err) {
            console.log("Error updating announcement:", err);
            return res.status(500).send('Error updating announcement');

        }
        res.status(200).send('Announcement updated successfully');

    })
});

// delete announcement endpoint authenticate only admin can delete
app.delete('/announcements/:id',authenticate, authorize,(req, res) => {
    const announcementId = req.params.id;
    const query = 'DELETE FROM announcements WHERE id = ?';
    db.query(query, [announcementId], (err, result) => {
        if (err) {
            console.log("Error deleting announcement:", err);
            return res.status(500).send('Error deleting announcement');
        }

        res.status(200).send('Announcement deleted successfully');
    });

});

// ------------------
// Start server
// ------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
