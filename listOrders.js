const LiteJsonDB = require('litejsondb');
const joi = require('joi');

// Initialisation de la base de données JSON
const db = new LiteJsonDB({

  filename: 'orders.json', 
   
//Active le log
  enableLog: true         
});

// Nombre fixe d'ordres/page
const ORDERS_PER_PAGE = 3; 

/**
 * Valide le numéro de page avec Joi
 * @param {number} pageNumber - Numéro de page à valider
 * @throws {Error} Si la validation échoue avec le message d'erreur détaillé
 */
function validatePageNumber(pageNumber) {
  const { error } = joi.number().integer().min(1).required().validate(pageNumber);
  if (error) throw new Error("Numéro de page invalide: " + error.details[0].message);
}

/**
 * Récupère le nombre total d'ordres enregistrés dans la base de données
 * @returns {number} Le nombre total d'ordres, 0 si aucun ordre existant
 */
function getTotalOrdersCount() {
  return db.get('orders/Count') || 0;
}

/**
 * Calcule le nombre total de pages disponibles en fonction du nombre total d'ordres
 * @param {number} totalOrders - Nombre total d'ordres
 * @returns {number} Le nombre total de pages arrondi à l'entier supérieur
 */
function calculateTotalPages(totalOrders) {
  return Math.ceil(totalOrders / ORDERS_PER_PAGE);
}

/**
 * Récupère les ordres pour une page spécifique avec pagination inversée
 * @param {number} pageNumber - Numéro de page à récupérer
 * @returns {Array<Object>} Liste des ordres triés du plus récent au plus ancien
 */
function getOrdersForPage(pageNumber) {
  const totalOrders = getTotalOrdersCount();
  const totalPages = calculateTotalPages(totalOrders);
  
  if (pageNumber > totalPages) return []; // Retourne vide si page inexistante

  // Calcul des IDs de début et fin pour la pagination
  const startOrderId = Math.max(1, totalOrders - (pageNumber * ORDERS_PER_PAGE) + 1);
  const endOrderId = Math.min(totalOrders, startOrderId + ORDERS_PER_PAGE - 1);

  // Récupération des ordres dans la plage calculée
  const orders = [];
  for (let id = startOrderId; id <= endOrderId; id++) {
    const order = db.get(`orders/listOfOrders/${id}`);
    if (order) orders.push(order);
  }

  return orders.reverse(); // Tri du plus récent au plus ancien
}

/**
 * Fonction principale de listing paginé des ordres avec métadonnées
 * @param {number} [pageNumber=1] - Numéro de page (défaut: 1)
 * @returns {Promise<Object>} Objet contenant:
 *   - orders: {Array<Object>} Liste des ordres de la page
 *   - pagination: {Object} Métadonnées de pagination
 * @throws {Error} Si la récupération des ordres échoue
 */
async function listOrders(pageNumber = 1) {
  try {
    validatePageNumber(pageNumber);

    const totalOrders = getTotalOrdersCount();
    const currentPageOrders = getOrdersForPage(pageNumber);

    return {
      orders: currentPageOrders,
      pagination: {
        currentPage: pageNumber,
        itemsPerPage: ORDERS_PER_PAGE,
        totalItems: totalOrders,
        totalPages: calculateTotalPages(totalOrders),
        hasNextPage: pageNumber < calculateTotalPages(totalOrders),
        hasPreviousPage: pageNumber > 1
      }
    };
  } catch (error) {
    throw new Error('Error while getting  orders: ' + error.message);
  }
}

module.exports = {listOrders};
