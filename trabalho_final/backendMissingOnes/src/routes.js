const express = require('express');
const routes = express.Router();

routes.get('/',(req, res) => {
    res.send('Hello')
})

//rotas das pessoas desaparecidas
const MissingOneController = require('./controllers/MissingOneController');
routes.get('/MissingOne/:id', MissingOneController.show);
routes.get('/MissingOnes', MissingOneController.showAll);


module.exports = routes;