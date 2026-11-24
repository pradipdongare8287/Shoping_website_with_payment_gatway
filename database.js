
const mysql = require('mysql2');
const util = require('util');

require('dotenv').config();

var database = mysql.createPool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

var promiseDatabase = database.promise();

var query = util.promisify(database.query).bind(database);

// Transaction साठी स्वतंत्र Connection
query.getConnection = async () => {
    return await promiseDatabase.getConnection();
};

module.exports = query;



// var database = mysql.createConnection({
//     host:process.env.DB_HOST,
//     user:process.env.DB_USER, 
//     port:process.env.DB_PORT,
//     password:process.env.DB_PASSWORD,
//     database:process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });
