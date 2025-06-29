
const LiteJsonDB = require('litejsondb');

// Initialisation de la db JSON
const { db } = require('./db');
/**
 * Récupère tous les ordres depuis la DB
 * @async
 * @function gettingData
 * @returns {Promise<Array<Object>|Array<{}>>} Tableau d'ordres ou tableau vide en cas d'erreur
 * @throws {Error} Si la lecture de la base échoue
 */
async function gettingData() {
  
  try {
    // Récupération de tous les ordres depuis la DB
    let allOrders = await db.get('orders/listOfOrders') || {};
    

    let ordersArray = Object.values(allOrders);
    return ordersArray;
    
  } catch (error) {

    console.error("Error while asking db:", error);
    
    return [{}];
  }
}

module.exports = {gettingData};
