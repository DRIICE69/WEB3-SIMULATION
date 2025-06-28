# WEB3-SIMULATION

Une application Node.js simple simulant un carnet d'ordres pour l'échange de crypto. Elle permet de :

- Créer des ordres (ask, bid)
- Calculer des taux de change optimaux
- Visualiser les ordres en temps réel via WebSocket

## 🚀 Installation & Lancement

### Prérequis

- Node.js ≥ 14
- npm

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/DRIICE69/WEB3-SIMULATION.git
cd WEB3-SIMULATION

# 2. Installer les dépendances
npm install express litejsondb joi helmet express-rate-limit socket.io

# 3. Lancer le serveur
node index.js
```

Le serveur écoute par défaut sur http://localhost:3000.

## 📦 Dépendances utilisées

| Package         | Rôle                                  |
|-----------------|---------------------------------------|
| express         | Serveur web HTTP                      |
| litejsondb      | Base de données JSON légère           |
| joi             | Validation de schémas                 |
| socket.io       | Communication en temps réel           |
| helmet          | Sécurisation des en-têtes HTTP        |
| express-rate-limit | Limitation de requêtes             |


## 🔁 Architecture des fichiers


| Fichier             | Roles                                      |
|---------------------|--------------------------------------------|
| `index.js`          | Point d'entrée principal (API + WebSocket) |
| `makeorder.js`      | Validation et création des ordres          |
| `listOrders.js`     | Pagination des ordres                      |
| `getRate.js`        | Calcul du taux optimal d'une paire         |
| `calculate.js`      | Algorithme de calcul de taux                |
| `CheckCrypto.js`    | Vérification + récupération des prix crypto |
| `autoPairRate.js`   | Recherche des paires échangeables          |
| `socketEmission.js` | Envoi des événements via WebSocket         |


## 📡 API REST

### ➕ POST `/api/order`

Créer un nouvel ordre.

**Body JSON :**
```json
{
  "amount": 100,
  "type": "ask",
  "from": "TRX",
  "to": "SOL",
  "price": 0.5
}
```

**Types valides :**
- `ask` : vendre `from` pour obtenir `to`
- `bid` : acheter `from` avec `to`


### 📃 GET `/api/order/:page`

Lister les ordres paginés (3 par page, plus récents en premier).

**Exemple :**
```
GET /api/order/1
```

### 💱 GET `/api/rate/:from/:to/:amount`

Calculer le taux optimal de change basé sur les ordres existants.

**Exemple :**
```
GET /api/rate/BNB/BTC/100
```

## 🌐 WebSocket (Socket.io)

Connexion au namespace racine (`/`). Deux événements émis :

- `newOrders` : lors de la création d'un nouvel ordre
- `rateOnTime` : mise à jour automatique des paires échangeables toutes les 5 secondes

## 🛠 Fonctions Utiles

| Fichier            | Fonction                 | Description                                                                         |
|--------------------|--------------------------|-------------------------------------------------------------------------------------|
| `calculate.js`     | `calculateOptimalRate()` | Calcule combien on recevrait pour un montant donné, en prenant les meilleurs ordres |
| `makeorder.js`     | `sendOrder()`            | Valide, enregistre et émet un ordre                                                 |
| `autoPairRate.js`  | `findChangebleAssets()`  | Recherche les paires from/to échangeables                                           |
| `CheckCrypto.js`   | `fetchCryptoPrice()`     | Appelle l'API CoinGecko pour les prix en USD                                        | 

## 🧪 Exemples de test (via cURL)

### Créer un ordre :
```bash
curl -X POST "http://localhost:3000/api/order" \
-H "Content-Type: application/json" \
-d '{
  "amount": 100,
  "type": "ask",
  "from": "TRX",
  "to": "SOL",
  "price": 0.5
}'
```

### Obtenir un taux de change :
```bash
curl -X GET "http://localhost:3000/api/rate/BNB/BTC/100"
```

## 📎 Remarques

- Les prix sont récupérés via l'API publique de CoinGecko
- L'API CoinGecko accepte 2 requêtes par/min <https://docs.coingecko.com/reference/common-errors-rate-limit>
- C'est uniquement l'envoi d'ordre qui utilise CoinGecko

