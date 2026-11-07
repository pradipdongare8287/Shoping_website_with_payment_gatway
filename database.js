const mysql = require('mysql2')
const util = require('util')

var database = mysql.createConnection({
    host:'bh1yu1sdpuf8dqrdl9tq-mysql.services.clever-cloud.com',
    user:'ul1mtsgkktsao2rt',
    password:'zSKcvFLncXrrec1KFjpT',
    database:'bh1yu1sdpuf8dqrdl9tq'
})

var query = util.promisify(database.query).bind(database)

module.exports = query
