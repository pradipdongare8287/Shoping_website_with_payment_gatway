// const mysql = require('mysql2')
// const util = require('util')

// var database = mysql.createConnection({
//     host:'bh1yu1sdpuf8dqrdl9tq-mysql.services.clever-cloud.com',
//     user:'ul1mtsgkktsao2rt',
//     password:'zSKcvFLncXrrec1KFjpT',
//     database:'bh1yu1sdpuf8dqrdl9tq'
// })

// var database = mysql.createConnection({
//     host:'localhost',
//     user:'root',
//     password:'root',
//     database:'shoping_website'
// })

// var query = util.promisify(database.query).bind(database)

// module.exports = query


const mysql = require('mysql2');
require('dotenv').config();


const database = mysql.createPool({
    host: process.env.DB_HOST,
    // port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Promise Based Query
const promisePool = database.promise();

const query = async (sql, values = []) => {
    try {
        const [result] = await promisePool.query(sql, values);
        return result;
    } catch (error) {
        console.error('MySQL Query Error:', error.code || error.message);
        throw error;
    }
};

// Check Database Connection
database.getConnection((error, connection) => {
    if (error) {
        console.error('Database Connection Failed:', error.code || error.message);
        return;
    }

    console.log('Clever Cloud Database Connected Successfully!');
    connection.release();
});

module.exports = query;



