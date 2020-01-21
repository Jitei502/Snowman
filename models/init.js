let conn = require('../config/connexion.js');
const {Connection, query, db} = require('stardog');
var d3 = require("d3");
class Init {
	static run (cb){
		query.execute(conn,'snowman', 'select ?c where {?c rdf:type :Cell . FILTER (?c != :wall)}',
			'application/sparql-results+json', {
				offset:0,
				reasoning: true
		}).then(({body}) =>{
			var data = body.results.bindings;
			var posPlayer = this.getRandomInt(data.length);
			var posLeg = posPlayer;
			while(posLeg == posPlayer){
				posLeg = this.getRandomInt(data.length);
			}
			var posBody = posPlayer;
			while(posBody == posPlayer || posBody == posLeg){
				posBody = this.getRandomInt(data.length);
			}
			var posHead = posPlayer;
			while(posHead == posPlayer || posHead == posBody || posBody == posLeg){
				posHead = this.getRandomInt(data.length);
			}
			this.setInitPos(data,'Player',posPlayer, posLeg,posBody,posHead, function(d){
				cb(d)
			});
		}).catch(e=> {console.log(e);});

	}
	static setInitPos(da, elem, posPlayer, posLegs, posBody,posHead, cb){
		if(elem == 'Player'){
			var pos = da[posPlayer];
			var next = 'Legs'
		}
		if(elem == 'Legs'){
			var pos = da[posLegs];
			var next = 'Body';
		}
		if(elem == 'Body'){
			var pos = da[posBody];
			var next = 'Head';
		}
		if(elem == 'Head'){
			var pos = da[posHead];
		}

		query.execute(conn, 'snowman', 'select ?c where {?c rdf:type :Cell'+elem+'}',
			'application/sparql-results+json', {
				offset:0,
				reasoning: true
			}).then(({body}) =>{
				var data = body.results.bindings;
				console.log(data);
				var cellDelete;
				if(data.length!=0){
					cellDelete = data[0].c.value
				}
				query.execute(conn, 'snowman', 'delete data {<'+cellDelete+'> rdf:type :Cell'+elem+'}',
					'application/sparql-results+json', {
						offset:0,
						reasoning: true
				}).then(res =>{
					console.log(res.status)
					query.execute(conn, 'snowman', 'insert data {<'+pos.c.value+'> rdf:type :Cell'+elem+'}',
						'application/sparql-results+json', {
							offset:0,
							reasoning: true
					}).then(res =>{
						console.log(res.status);
						if(elem != 'Head'){
							this.setInitPos(da, next, posPlayer, posLegs,posBody, posHead, function(d){
								cb(d);
							});
						}
						else{
							this.deleteMix(data, function(d){
								cb(d);
							})
						}
					}).catch(e=> {console.log(e);});
				}).catch(e=> {console.log(e);});
			}).catch(e=> {console.log(e);});
	}

	static deleteMix(donnee, cb){
		query.execute(conn, 'snowman', 'select ?c where {?c rdf:type :CellMixBodyLegs}',
			'application/sparql-results+json', {
				offset:0,
				reasoning: true
			}).then(({body}) =>{
				var data = body.results.bindings;
				console.log(data);
				var cellDelete;
				if(data.length!=0){
					cellDelete = data[0].c.value
				}
				query.execute(conn, 'snowman', 'delete data {<'+cellDelete+'> rdf:type :CellMixBodyLegs}',
					'application/sparql-results+json', {
						offset:0,
						reasoning: true
				}).then(res =>{
					console.log(res.status)
					query.execute(conn, 'snowman', 'select ?c where {?c rdf:type :CellMixHeadBody}',
						'application/sparql-results+json', {
							offset:0,
							reasoning: true
					}).then(({body}) =>{
						var data = body.results.bindings;
						var cellDelete;
						if(data.length!=0){
							cellDelete = data[0].c.value
						}
						query.execute(conn, 'snowman', 'delete data {<'+cellDelete+'> rdf:type :CellMixBodyLegs}',
						'application/sparql-results+json', {
							offset:0,
							reasoning: true
						}).then(res =>{
							this.initFini(function(donnee){
								cb(donnee);
							})

						}).catch(e=> { console.log(e);});
					}).catch(e=> {console.log(e);});
				}).catch(e=> {console.log(e);});
			}).catch(e=> {console.log(e);});
	}
	static getRandomInt(max){
		return Math.floor(Math.random() * Math.floor(max));
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


module.exports = Init;