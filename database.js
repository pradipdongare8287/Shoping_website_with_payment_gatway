const mysql = require('mysql2');
const util = require('util');

require('dotenv').config();
// const mysql = require('mysql2')
// const util = require('util')

// var database = mysql.createConnection({
//     host:'bh1yu1sdpuf8dqrdl9tq-mysql.services.clever-cloud.com',
//     user:'ul1mtsgkktsao2rt',
//     password:'zSKcvFLncXrrec1KFjpT',
//     database:'bh1yu1sdpuf8dqrdl9tq'
// })



var database = mysql.createPool({
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
    var connection = await util.promisify(database.getConnection).bind(database)();
    return connection.promise();
};
module.exports = query;



// const mysql = require('mysql2');





