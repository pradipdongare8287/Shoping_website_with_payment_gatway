const mysql = require('mysql2');
const util = require('util');

require('dotenv').config();
// const mysql = require('mysql2')
// const util = require('util')

// var database = mysql.createConnection({
//     host:'localhost',
//     user:'root',
//     password:'root',
//     database:'shoping_website'
// })



var database = mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER, 
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

var query = util.promisify(database.query).bind(database);

// Transaction साठी स्वतंत्र Connection
query.getConnection = async () => {
    return database.promise();
};
module.exports = query;



// const mysql = require('mysql2');





