let conn = require('../config/connexion.js');
const {Connection, query, db} = require('stardog');
var d3 = require("d3");

class Move {
	static up (cb){
		query.execute(conn, 'snowman','select ?p ?c where {?c rdf:type :CellPlayer . ?c :hasNorth ?p}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(({body})=>{
			var data = body.results.bindings;
			this.checkWall(data,'North',cb);
		}).catch(e=> {console.log(e);});
	}

	static down (cb){
		query.execute(conn, 'snowman','select ?p ?c where {?c rdf:type :CellPlayer . ?c :hasSouth ?p}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(({body})=>{
			var data = body.results.bindings;
			this.checkWall(data,'South',cb);
		}).catch(e=> {console.log(e);});
	}

	static left (cb){
		query.execute(conn, 'snowman','select ?p ?c where {?c rdf:type :CellPlayer . ?c :hasWest ?p}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(({body})=>{
			var data = body.results.bindings;
			this.checkWall(data,'West',cb);
		}).catch(e=> {console.log(e);});
	}

	static right (cb){
		query.execute(conn, 'snowman','select ?p ?c where {?c rdf:type :CellPlayer . ?c :hasEast ?p}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(({body})=>{
			var data = body.results.bindings;
			this.checkWall(data,'East',cb);
		}).catch(e=> {console.log(e);});
	}

	static checkWall (data,dir,cb){
	query.execute(conn, 'snowman','ASK WHERE{{?c rdf:type :CellPlayer . ?c :has'+dir+' :wall} UNION {?c rdf:type :CellPlayer . ?c :has'+dir+' :CellMixBodyLegs} UNION {?c rdf:type :CellPlayer . ?c :has'+dir+' :CellMixHeadBody} UNION {?c rdf:type :CellPlayer . ?c :has'+dir+' :CellSnowman}}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(res =>{
			console.log(res)
			console.log("Wall");
			console.log(res.body.boolean);
			if(res.body.boolean == true){
				this.initFini(cb);
			}
			else{

				this.checkOnePart(data,dir, cb);
			}
		}).catch(e=> {console.log(e);});

	}

	static checkOnePart(data, dir, cb){
	query.execute(conn, 'snowman','ASK WHERE{{?c rdf:type :CellPlayer . ?c :has'+dir+' ?p . ?p rdf:type :CellLegs}  UNION  {?c rdf:type :CellPlayer . ?c :has'+dir+' ?p . ?p rdf:type :CellBody}  UNION  {?c rdf:type :CellPlayer . ?c :has'+dir+' ?p. ?p rdf:type :CellHead} }',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(res =>{
			if(res.body.boolean == true){
				this.checkSecondPart(data,dir,cb);
			}
			else{

				this.deleteOldPos(data[0].p.value, data[0].c.value, cb);
			}
		}).catch(e=> {console.log(e);});
	}

	static checkSecondPart(data, dir, cb){
	query.execute(conn, 'snowman','ASK WHERE{{?c rdf:type :CellPlayer . ?c :has'+dir+' ?n .?n rdf:type :CellHead . ?c :hasNext'+dir+' ?p . ?p rdf:type :CellLegs}  UNION  {?c rdf:type :CellPlayer .?c :has'+dir+' ?x. ?x rdf:type :CellLegs . ?c :hasNext'+dir+' ?p . ?p rdf:type :CellBody}  UNION  {?c rdf:type :CellPlayer . ?c :hasNext'+dir+' ?p. ?p rdf:type :CellHead} UNION {?c rdf:type :CellPlayer . ?c :hasNext'+dir+' :wall}}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(res =>{
			if(res.body.boolean == true){
				this.checkVictory(data,dir,cb);
			}
			else{
				this.getOldPosSnowman(data[0].p.value,data[0].c.value,dir,cb);
			}
		}).catch(e=> {console.log(e);});
	}

	static checkVictory(data, dir, cb){
	query.execute(conn, 'snowman','ASK WHERE{{?c rdf:type :CellPlayer . ?c :has'+dir+' ?n . ?n rdf:type :CellHead . ?c :hasNext'+dir+' ?p . ?p rdf:type :CellMixBodyLegs}}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(res =>{
			console.log(res);
			if(res.body.boolean == true){
				this.getOldPosSnowman(data[0].p.value,data[0].c.value,dir,cb);
							}
			else{
				this.initFini(cb);
			}
		}).catch(e=> {console.log(e);});	
	}
	static getOldPosSnowman(p,c,dir,cb){
		query.execute(conn, 'snowman','select ?c ?p where { <'+p+'> rdf:type ?c . <'+p+'> :has'+dir+' ?p . FILTER(?c != :Cell) . FILTER(?c != <http://www.w3.org/2002/07/owl#Thing>)}',
			'application/sparql-results+json', {
				offset:0,
				reasoning: true
			}).then(({body})=>{
				var data = body.results.bindings;
				this.deleteOldPosSnowman(p,c,data[0].c.value,data[0].p.value,dir, cb);
			}).catch(e=> {console.log(e);});
	}

	static deleteOldPosSnowman(p,c,t,np ,dir,cb){
		query.execute(conn, 'snowman','delete data {<'+p+'> rdf:type <'+t+'>}',
			'application/sparql-results+json', {
				offset:0,
				reasoning: true
			}).then(res=>{
				this.insertNewPosSnowman(p,c,t,np,dir,cb);
			}).catch(e=> {console.log(e);});
	}

	static insertNewPosSnowman(p,c,t,np,dir,cb){
		query.execute(conn, 'snowman','insert data {<'+np+'> rdf:type <'+t+'>}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(res=>{
			this.deleteOldPos(p,c,cb);
		}).catch(e=> {console.log(e);});	
	}

	static deleteOldPos (p,c,cb){
		query.execute(conn, 'snowman','delete data {<'+c+'> rdf:type :CellPlayer}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(res =>{
			this.insertNewPos(p,cb);
		}).catch(e=> {console.log(e);});
	}
	static insertNewPos (p,cb){
		query.execute(conn, 'snowman','insert data {<'+p+'> rdf:type :CellPlayer}',
		'application/sparql-results+json', {
			offset:0,
			reasoning: true
		}).then(res=>{

			this.initFini(cb);
		}).catch(e=> {console.log(e);});		
	}
	static initFini(cb){
		query.execute(conn, 'snowman','select ?c ?p where {?c rdf:type ?p . FILTER (?c != :wall) . FILTER(?c != :player) }',
			'application/sparql-results+json', {
				offset:0,
				reasoning: true
			}).then(({body})=>{
				var data = this.handle(body.results.bindings);
				cb(data);
			}).catch(e=> {console.log(e);});
	}
	static handle(d){
		var input = d.map(d => {return {"id":d.c.value,"concept": d.p.value}});
		var data = d3.nest()
			.key(d => {return d.id})
			.rollup(v => {return v.map(d => {return d.concept})})
			.map(input);
		return data;
	}
}

module.exports = Move;