const LiteJsonDB = require('litejsondb');

// Initialisation de la DB
const db = new LiteJsonDB({

  filename: 'orders.json', 
   
//Active le log
//  enableLog: true         
});

const GetDataFromDB = require('./queuingDb')
// Import helpers pour le calcul A/B auto
const autoPairRate = require('./autoPairRate.js');
let io;

/**
 * Initialise le socket.io pour l'émission d'événements
 * @param {Object} _io - Instance de socket.io
 * @returns {void}
 */
function initSocketEmission(_io) {
  io = _io;
}

/**
 * Met à jour et émet les taux de change en temps réel à intervalle régulier
 * @returns {void}
 * @throws {Error} Si une erreur survient lors de la récupération ou du calcul des taux
 */
async function RateOnRealTime() {
  setInterval(async () => {
    try {
      // Récupération de tous les ordres depuis la DB à chaque intervalle
      let ordersArray = await GetDataFromDB.gettingData()
      let result = await autoPairRate.findChangebleAssets(ordersArray);
      if(io.engine.clientsCount > 0){
        io.emit("rateOnTime", result);
      }
    } catch (error) {
      console.error("Error while asking db:", error);
    }
  }, 5000);
}

/**
 * Émet un nouvel ordre via socket.io aux clients connectés
 * @param {Object} order - L'ordre à émettre
 * @returns {void}
 */
function Emit(order) {
  if (io.engine.clientsCount > 0) {
    io.emit('newOrders', order);
  }
}

module.exports = { initSocketEmission, Emit, RateOnRealTime };
