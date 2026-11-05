const express = require("express");
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || "mysql-service",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "signup",
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed (Waiting for MySQL to boot...):", err.message);
        return;
    }
    console.log("Connected to Docker MySQL Database!");

    const createTableSql = `
        CREATE TABLE IF NOT EXISTS login (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        )
    `;
    
    connection.query(createTableSql, (tableErr) => {
        connection.release();
        if (tableErr) {
            console.error("Error creating table:", tableErr);
        } else {
            console.log("Table 'login' is ready inside Docker!");
        }
    });
});

app.post('/signup' , (req, res) => {
    const sql = "INSERT INTO login (`name`,`email`,`password`) VALUES (?, ?, ?)";
    const values = [
        req.body.name,
        req.body.email,
        req.body.password,
    ]
    db.query(sql, values, (err, data) => {
        if(err) {
            console.error("Database Error:", err);
            return res.json("Error");
        }
        return res.json(data);
    })
})

app.post('/login' , (req, res) => {
    const sql = "SELECT * FROM login WHERE `email` = ? AND `password` = ?";
    const values = [
        req.body.email,
        req.body.password
    ];

    db.query(sql, values, (err, data) => {
        if(err) {
            console.error("Database Error:", err);
            return res.json("Error");
        }
        if(data.length > 0) {
            return res.json("Success");
        } else {
            return res.json("Fail");
        }
    })
})
    
app.listen(8081, ()=> {
    console.log("listening on port 8081");
})