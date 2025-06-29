const LiteJsonDB = require('litejsondb');

// Initialisation de la base de données JSON
const db = new LiteJsonDB({

  filename: 'orders.json', 
   
//Active le log
  enableLog: true         
});

module.exports = {db}
