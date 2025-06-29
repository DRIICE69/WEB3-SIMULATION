// Appelle de la func. de calcul Rate A/B
const getSingleRate = require('./getRate');

/**
 * Trouve les actifs échangeables dans un orderBook et calcule leurs taux de change
 * @param {Array<Object>} orderBook - Carnet d'ordres contenant les ordres à analyser
 * @returns {Promise<Array<Object>|string>} Tableau des paires échangeables avec leurs taux ou message d'erreur
 * @throws {Error} Si une erreur survient lors du traitement
 */
 
async function findChangebleAssets(orderBook) { 
  const exchangbleAssets = [];

  //  Trouver les paires échangeables
  for (let i = 0; i < orderBook.length; i++) {
    const order1 = orderBook[i];
    const pair1 = `${order1.assetA.symbol}-${order1.assetB.symbol}`;
    
    for (let j = 0; j < orderBook.length; j++) {
      const order2 = orderBook[j];
      const pair2 = `${order2.assetB.symbol}-${order2.assetA.symbol}`;
      
      // Vérifier la paire inverse avec type opposé
      if (pair1 === pair2 && order1.type !== order2.type) {
        const newPair = {
          FROM: order1.assetA.symbol,
          TO: order1.assetB.symbol
        };

        // Éviter les doublons
        if (!exchangbleAssets.some(p => p.FROM === newPair.FROM && p.TO === newPair.TO)) {
          exchangbleAssets.push(newPair);
        }
      }
    }
  }

  //  Si aucune paire trouvée
  if (exchangbleAssets.length === 0) {
    return "Empty trade, come back later";
  }

  //  Calculer les taux d'échange
  const tradeRates = [];
  for (let i = 0; i < exchangbleAssets.length; i++) {
    const from = exchangbleAssets[i].FROM;
    const to = exchangbleAssets[i].TO;
    
    try {
      const rate = await getSingleRate.getRate(from, to, 1);
      tradeRates.push({
        pair: `${from}/${to}`,
        rate: rate.amountReceivable  
      });
    } catch (error) {
      console.error(`Error while calculating Rate for ${from}/${to}:`, error);
      tradeRates.push({
        pair: `${from}/${to}`,
        rate: null,
        error: "Rate calculation failed"
      });
    }
  }

  return tradeRates;
}

module.exports = { findChangebleAssets };
