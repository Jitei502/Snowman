let express = require('express');


let app = express();

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (request, response) =>{
	

	let Init = require('./models/init');
	Init.run(function(data){
		response.render('pages/index', {test: data.entries()});
	});
});
app.get('/up', (request, response) =>{
	

	let Move = require('./models/move');
	Move.up(function(data){
		response.render('pages/index', {test: data.entries()});
	});
});
app.get('/down', (request, response) =>{
	

	let Move = require('./models/move');
	Move.down(function(data){
		response.render('pages/index', {test: data.entries()});

	});
});
app.get('/right', (request, response) =>{

	let Move = require('./models/move');
	Move.right(function(data){
		response.render('pages/index', {test: data.entries()});

	});
});
app.get('/left', (request, response) =>{

	let Move = require('./models/move');
	Move.left(function(data){
		response.render('pages/index', {test: data.entries()});

	});
});


app.listen(8080);