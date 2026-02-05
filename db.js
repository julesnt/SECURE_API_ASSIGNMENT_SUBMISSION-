// const mysql = require("mysql2");

// const db = mysql.createConnection({
// host: process.env.DB_HOST,
// user: process.env.DB_USER,
// password: process.env.DB_PASSWORD,
// database: process.env.DB_NAME,
// port: process.env.DB_PORT

// });
// db.connect((err) => {
// if (err) {
// console.error("Error connecting to the database: ",err);
// }
// else {
// console.log("Connected to the database.");

// }
// });

// module.exports = db;

const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

// Add SSL for Aiven when CA_CERT_PATH is set
if (process.env.CA_CERT_PATH) {
  const certPath = path.resolve(process.cwd(), process.env.CA_CERT_PATH);
  const caCert = fs.readFileSync(certPath, "utf8");
  connectionConfig.ssl = {
    ca: caCert,
    rejectUnauthorized: true
  };
}

const db = mysql.createConnection(connectionConfig);

db.connect((err) => {
  if (err) {
    console.log("Error connecting to the database: ", err);
  } else {
    console.log("Connected to the database.");
  }
});

module.exports = db;