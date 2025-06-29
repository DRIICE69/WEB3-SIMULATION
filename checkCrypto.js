
//  symboles cryptos vers leurs identifiants CoinGecko
const cryptoIds = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'LTC': 'litecoin',
  'ATOM': 'cosmos',
  'TRX': 'tron',
};

/**
 * Valide un symbole crypto et retourne son ID CoinGecko
 * @param {string} symbol - Symbole crypto (ex: 'BTC')
 * @returns {string} ID CoinGecko
 * @throws {Error} Si le symbole n'est pas supporté
 */
function validateCrypto(symbol) {
  const upperSymbol = symbol.toUpperCase();
  if (!cryptoIds[upperSymbol]) {
    throw new Error(`Unsupported coins: ${symbol}`);
  }
  return cryptoIds[upperSymbol];
}

/**
 * Récupère le prix USD actuel d'une crypto via l'API CoinGecko
 * @param {string} symbol - Symbole crypto (ex: 'BTC')
 * @returns {Promise<number>} Prix actuel en USD
 * @throws {Error} Si la requête API échoue ou retourne des données invalides
 */
async function fetchCryptoPrice(symbol) {
  try {
    // Validation du symbole et récupération de l'ID CoinGecko
    const coinId = validateCrypto(symbol);
    
    // Appel à l'API CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    
    // Vérification du statut de la réponse
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Extraction des données JSON
    const data = await response.json();
    
    // Vérification du format de réponse
    if (!data[coinId]?.usd) {
      throw new Error('Invalid API response format');
    }

    return data[coinId].usd;
    
  } catch (error) {
    throw new Error(`Error while getting  price: ${error.message}`);
  }
}

module.exports = { fetchCryptoPrice, validateCrypto}
