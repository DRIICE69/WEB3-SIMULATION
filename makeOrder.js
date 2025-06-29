const joi = require('joi');
const LiteJsonDB = require('litejsondb');

const socketEmission = require("./socketEmission")

// Initialisation de la DB JSON
const db = new LiteJsonDB({

  filename: 'orders.json', 
   
//Active le log
  enableLog: true         
});

// Import des functions externes
const { fetchCryptoPrice, validateCrypto } = require('./checkCrypto.js');

/**
 * Valide les paramètres d'un ordre selon un schéma Joi
 * @param {string} OrdersType - Type d'ordre ('ask', 'bid' ou 'limit')
 * @param {number} amount - Montant de l'ordre
 * @param {number} [OrderPrice] - Prix de l'ordre (requis pour les 'limit')
 * @param {string} OrderFrom - Symbole de l'actif source (3 lettres)
 * @param {string} OrderTo - Symbole de l'actif cible (3 lettres)
 * @throws {Error} Si la validation échoue
 */
function validateOrderParameters(OrdersType, amount, OrderPrice, OrderFrom, OrderTo) {
  const schema = joi.object({
    type: joi.string().valid('ask', 'bid', 'limit').required(),
    amount: joi.number().positive().required(),
    price: joi.number().positive().when('type', {
      is: joi.string().valid('limit'),
      then: joi.required()
    }),
    from: joi.string().length(3).uppercase(),
    to: joi.string().length(3).uppercase()
  });

  const { error } = schema.validate({
    type: OrdersType,
    amount: amount,
    price: OrderPrice,
    from: OrderFrom,
    to: OrderTo
  });
  
  if (error) throw new Error(error.details[0].message);
}

/**
 * Détermine le prix final selon le type d'ordre
 * @param {string} OrdersType - Type d'ordre ('ask', 'bid' ou 'limit')
 * @param {number} [OrderPrice] - Prix spécifié (pour les 'limit')
 * @param {string} OrderFrom - Symbole de l'actif source
 * @returns {Promise<number>} Prix final en USD
 */
async function determineFinalPrice(OrdersType, OrderPrice, OrderFrom) {
  if (OrdersType !== 'limit' && OrderPrice) {
    return await fetchCryptoPrice(OrderFrom);
  }
  return OrderPrice;
}

/**
 * Crée et enregistre un nouvel ordre dans la DB
 * @param {string} OrdersType - Type d'ordre
 * @param {number} amount - Montant de l'ordre
 * @param {number} finalPrice - Prix final en USD
 * @param {string} OrderFrom - Symbole de l'actif source
 * @param {string} OrderTo - Symbole de l'actif cible
 * @returns {Promise<object>} L'ordre créé avec tous ses détails
 */
async function createNewOrder(OrdersType, amount, finalPrice, OrderFrom, OrderTo) {
  const newId = (db.get('orders/Count') || 0) + 1;
  const B_USDPrice = await fetchCryptoPrice(OrderTo);
  
  const order = {
    id: newId,
    type: OrdersType,
    amount: amount,
    price: finalPrice,
    assetA: { 
      symbol: OrderFrom,
      usd_price: finalPrice
      
    },
    assetB: { 
      symbol: OrderTo,
      usd_price: B_USDPrice 
    },
    timestamp: Date.now()
  };
  
  // Sauvegarde dans la db
  db.set(`orders/listOfOrders/${newId}`, order);
  db.saveNow()
  db.set('orders/Count', newId);
  db.saveNow()
 //Emettre l'ordre
 socketEmission.Emit(order)
 
  return order;
}

/**
 * Fonction principale pour envoyer un nouvel ordre
 * @param {number} [OrderPrice] - Prix de l'ordre (optionnel sauf pour 'limit')
 * @param {number} amount - Montant de l'ordre
 * @param {string} OrdersType - Type d'ordre ('ask', 'bid' ou 'limit')
 * @param {string} [OrderFrom="BNB"] - Symbole de l'actif source (défaut: BNB)
 * @param {string} [OrderTo="TRX"] - Symbole de l'actif cible (défaut: TRX)
 * @returns {Promise<object>} L'ordre créé avec tous ses détails
 * @throws {Error} Si la validation ou la création échoue
 */
async function sendOrder(OrderPrice, amount, OrdersType, OrderFrom, OrderTo) {
  // Valeurs par défaut
  OrderFrom = OrderFrom || "BNB";
  OrderTo = OrderTo || "TRX";

  // Validation des entrées
  validateOrderParameters(OrdersType, amount, OrderPrice, OrderFrom, OrderTo);
  
  // Calcul du prix
  const finalPrice = await determineFinalPrice(OrdersType, OrderPrice, OrderFrom);
  
  // Création de l'ordre
  return await createNewOrder(OrdersType, amount, finalPrice, OrderFrom, OrderTo);
}

module.exports = {sendOrder}
