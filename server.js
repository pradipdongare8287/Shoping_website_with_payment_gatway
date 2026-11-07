const express = require('express')
const server = express()
const myslq = require('mysql2')
const cookie = require('cookie-parser')


var website = require('./routes/website.js')
var admin  = require('./routes/admin.js')

server.use('/',website)
server.use('/admin',admin)


server.listen(3000,()=>{
    console.log('Server Started On 3000 Port Number')
})