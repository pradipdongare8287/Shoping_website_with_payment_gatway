const mysql = require('mysql2')
const util = require('util')

var database = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    database:'Shoping_website'
})

var query = util.promisify(database.query).bind(database)

module.exports = query