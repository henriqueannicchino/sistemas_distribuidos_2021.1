const express = require('express');
const mongoose = require('mongoose');

const MissingOnes = require("../models/MissingOnes");

module.exports = {
	
	async show(req, res){
		const id = req.params.id;
		MissingOnes.find({"_id": id})
		.exec()
		.then(doc => {
			if(doc){
				res.status(200).json({
					MissingOnes: doc,
				});
			}else{
				res.status(404).json({message: 'Nenhuma pessoa desaparecida encontrada com o ID fornecido'});
			}
		})
		.catch(err => {
			res.status(500).json({error: err});
		});
		
	},
	
	async showAll(req, res){
		MissingOnes.find({})
		.select()
		.exec()
		.then(doc => {
			if(doc){
				res.status(200).json({
					MissingOnes: doc,
				});
			}else{
				res.status(404).json({message: 'Nenhuma desaparecido cadastrado'});
			}
		})
		.catch(err => {
			res.status(500).json({error: err});
		});
	},

};