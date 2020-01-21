const {Connection, query, db} = require('stardog');

const conn = new Connection({
	username: 'admin',
	password: 'admin',
	endpoint: 'http://localhost:5820',
});

module.exports = conn;