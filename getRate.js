const { db } = require('./db');
// Import du calculateur de taux
const rateCalculator = require('./calculate.js');

/**
 * Calcule le taux de change optimal pour une paire de crypto
 * @param {string} from - Symbole de la cryptomonnaie source (ex: 'ADA')
 * @param {string} to - Symbole de la cryptomonnaie cible (ex: 'LTC')
 * @param {number} [amountToExchange=1] - Montant à échanger (défaut: 1)
 * @returns {Promise<Object>} Objet contenant:
 *   - pair: {string} Paire d'échange (ex: 'BTC/ETH')
 *   - amountRequested: {number} Montant demandé
 *   - amountReceivable: {number} Montant obtenable
 *   - currency: {string} Devise cible
 *   - error?: {string} Message d'erreur si applicable
 * @throws {Error} Si le calcul du taux échoue
 */


async function getRate(from, to, amountToExchange) {
  from = from.toUpperCase(); to = to.toUpperCase();
  
  // Gestion de la valeur par défaut du montant
  const amount = amountToExchange || 1;

  try {
    // Récupération de tous les ordres depuis la DB
    const allOrders = db.get('orders/listOfOrders') || {};
    const ordersArray = Object.values(allOrders);

    // Tri des ordres pour la paire demandée
    const relevantOrders = ordersArray.filter(order => 
      order.assetA.symbol === from && order.assetB.symbol === to
      ||       order.assetB.symbol === from && order.assetB.symbol === to
    );

    if (relevantOrders.length === 0) {
      return { 
        error: `No orders found for :  ${from}/${to}` 
      };
    }

    // Calcul du taux
    let dir = `${from}/${to}`
    const result = await rateCalculator.calculateOptimalRate(ordersArray, amount,dir);


    return {
      pair: `${from}/${to}`,
      amountRequested: amount,
      amountReceivable: result,

    };
    
  } catch (err) {
    throw new Error(`Rate calculation failed: ${err.message}`);
  }
}

module.exports = {getRate};
