/**
 * Convertit une valeur en entier
 * @function conv
 * @param {string|number} valeur - Valeur à convertir
 * @returns {number} Valeur entière
 * @throws {Error} Si la valeur n'est pas convertible en entier
 */
function conv(valeur) {
  if (typeof valeur === "number" && Number.isInteger(valeur)) {
    return valeur;
  } else if (typeof valeur === "string" && /^\d+$/.test(valeur)) {
    return parseInt(valeur);
  } else {
    throw new Error("invalid param, int needed");
  }
}

/**
 * Calcule le taux de change optimal pour une paire de crypto
 * @async
 * @function calculateOptimalRate
 * @param {Array<Object>} orders - Liste des ordres du marché
 * @param {number|string} reqAmount - Montant à échanger
 * @param {string} [dir] - Direction de l'échange (ex: "ADA/LTC")
 * @returns {Promise<number>} Montant final après conversion et frais
 */
async function calculateOptimalRate(orders, reqAmount, dir) {
  let fee = 0.001;
  let amountToExchange = conv(reqAmount);

  // Vérifier si l'order book est vide
  if (orders.length === 0) return 0;

  // Préparer les ordres avec les taux de change
  const ordersWithRates = [];
  const DirRates = [{"ask":{},"bid":{}}];
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const rateAtoB = order.assetB.usd_price / order.assetA.usd_price;
    const rateBtoA = 1 / rateAtoB;
    ordersWithRates.push({
      type: order.type,
      amount: order.amount,
      symbolA: order.assetA.symbol,
      symbolB: order.assetB.symbol,
      rateAtoB: rateAtoB,
      rateBtoA: rateBtoA
    });
  }

  let assetFrom;
  let assetTo;
  let assetFromPrice = [];
  let assetToPrice = [];
  let is_dir = false;

  // Traitement lorsque la direction est spécifiée
  if (dir && dir.includes("/")) {
    is_dir = true;
    let rateDir = dir.split("/");
    assetFrom = rateDir[0].trim(); 
    assetTo = rateDir[1].trim();   
    
    for (let k = 0; k < orders.length; k++) {
      const order = orders[k];
        
      // Ordre de type ASK pour l'asset source
      if (order.type === "ask" && (order.assetA.symbol === assetFrom || order.assetB.symbol === assetFrom)) {
        assetFromPrice.push(order.assetA.symbol === assetFrom ? order.assetA.usd_price : order.assetB.usd_price);
      }
      // Ordre de type BID pour l'asset cible
      else if (order.type === "bid" && (order.assetA.symbol === assetTo || order.assetB.symbol === assetTo)) {
        assetToPrice.push(order.assetA.symbol === assetTo ? order.assetA.usd_price : order.assetB.usd_price);
      }
    }
  }

  // Calcul spécifique quand direction est fournie
  if (is_dir) {
    let bestPriceFrom = assetFromPrice.length > 0 ? Math.min(...assetFromPrice) : null;
    let bestPriceTo = assetToPrice.length > 0 ? Math.min(...assetToPrice) : null;

    if (bestPriceFrom !== null && bestPriceTo !== null) {
      let Rate = bestPriceFrom / bestPriceTo;
      let AmountBeSent = Rate;
      let deduceFee = AmountBeSent * fee; 
      let finalAmountToSend = AmountBeSent - deduceFee;
      return finalAmountToSend * amountToExchange;
    } else {
      return 0;
    }
  }

  // Séparation des asks et bids
  const asks = [];
  const bids = [];
  for (let i = 0; i < ordersWithRates.length; i++) {
    if (ordersWithRates[i].type === 'ask') {
      asks.push(ordersWithRates[i]);
    } else if (ordersWithRates[i].type === 'bid') {
      bids.push(ordersWithRates[i]);
    }
  }

  // Cas où il n'y a que des asks
  if (bids.length === 0 && asks.length > 0) {
    
    // Trier asks par meilleur prix (plus bas)
    for (let i = 0; i < asks.length; i++) {
      for (let j = i + 1; j < asks.length; j++) {
        if (asks[i].rateBtoA > asks[j].rateBtoA) {
          const temp = asks[i];
          asks[i] = asks[j];
          asks[j] = temp;
        }
      }
    }

    let remaining = amountToExchange;
    let totalReceived = 0;
    for (let i = 0; i < asks.length; i++) {
      if (remaining <= 0) break;
      const amount = Math.min(remaining, asks[i].amount);
      totalReceived += amount * asks[i].rateBtoA * (1 - fee);
      remaining -= amount;
    }
    return totalReceived;
  }

  // Cas où il n'y a que des bids
  else if (asks.length === 0 && bids.length > 0) {
    
    // Trier bids par meilleur prix (plus haut)
    for (let i = 0; i < bids.length; i++) {
      for (let j = i + 1; j < bids.length; j++) {
        if (bids[i].rateAtoB < bids[j].rateAtoB) {
          const temp = bids[i];
          bids[i] = bids[j];
          bids[j] = temp;
        }
      }
    }

    let remaining = amountToExchange;
    let totalReceived = 0;
    for (let i = 0; i < bids.length; i++) {
      if (remaining <= 0) break;
      const amount = Math.min(remaining, bids[i].amount);
      totalReceived += amount * bids[i].rateAtoB * (1 - fee);
      remaining -= amount;
    }
    return totalReceived;
  }

  // Cas où il y a les 2 types d'ordres
  else if (asks.length > 0 && bids.length > 0) {
    
    // Trier bids (meilleur prix en 1er)
    for (let i = 0; i < bids.length; i++) {
      for (let j = i + 1; j < bids.length; j++) {
        if (bids[i].rateAtoB < bids[j].rateAtoB) {
          const temp = bids[i];
          bids[i] = bids[j];
          bids[j] = temp;
        }
      }
    }

    // Trier asks (meilleur prix en 1er)
    for (let i = 0; i < asks.length; i++) {
      for (let j = i + 1; j < asks.length; j++) {
        if (asks[i].rateBtoA > asks[j].rateBtoA) {
          const temp = asks[i];
          asks[i] = asks[j];
          asks[j] = temp;
        }
      }
    }

    const bestBidRate = bids[0].rateAtoB * (1 - fee);
    const bestAskRate = asks[0].rateBtoA * (1 - fee);

    // Choisir la direction 
    if (bestBidRate >= 1 / bestAskRate) {
      // Vendre A pour B
      let remaining = amountToExchange;
      let totalReceived = 0;
      for (let i = 0; i < bids.length; i++) {
        if (remaining <= 0) break;
        const amount = Math.min(remaining, bids[i].amount);
        totalReceived += amount * bids[i].rateAtoB * (1 - fee);
        remaining -= amount;
      }
      return totalReceived;
    } else {
      // Vendre B pour A
      let remaining = amountToExchange;
      let totalReceived = 0;
      for (let i = 0; i < asks.length; i++) {
        if (remaining <= 0) break;
        const amount = Math.min(remaining, asks[i].amount);
        totalReceived += amount * asks[i].rateBtoA * (1 - fee);
        remaining -= amount;
      }
      return totalReceived;
    }
  }

  // Cas par défaut (pas d'ordre valide)
  return 0;
}

module.exports = {calculateOptimalRate};
