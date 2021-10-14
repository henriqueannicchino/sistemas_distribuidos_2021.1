const express = require('express');
const mongoose = require('mongoose');
const requireDir = require('require-dir');
const cors = require('cors');
const app = express();
require('dotenv').config();

//Permite o envio de dados para a aplica��o no formato de Json
app.use(express.json());
app.use(cors(/* IP */));

//Iniciando o DB

//const mongoURL = "mongodb://localhost:27017";

const mongoosInputConfig = {
	useNewUrlParser: true,
	useUnifiedTopology: true
}

/*mongoose.connect(
	'mongodb+srv://henriqueannicchino:' +
		process.env.PASSWORD + 
		'@annicchino-28ahg.gcp.mongodb.net/test?retryWrites=true&w=majority',
	{ useNewUrlParser: true, useUnifiedTopology: true }
);*/

mongoose.connect(
	'',
	{ useNewUrlParser: true, useUnifiedTopology: true }
);

mongoose.Promise = global.Promise;

let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback){
  console.log("Connection Succeeded")
});

requireDir('./src/models');

//"use" aceita todos os tipos de requisicoes
app.use('/', require("./src/routes"));

let port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log('Servidor funcionando em ' + port);
});