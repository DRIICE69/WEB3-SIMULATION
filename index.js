const helmet = require('helmet');
const express = require('express');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

/**
 * Point d'entrée principal de l'application Web3
 * Configuration du serveur Express et des routes API
 */
const expressApp = express();
const server = http.createServer(expressApp); // Création du serveur HTTP
const io = new Server(server, { // Initialisation de Socket.io
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuration du rate limiting, 100req/min
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Sever is busy try again, 1min later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Import des contrôleurs
const socketEmission = require('./socketEmission');
socketEmission.initSocketEmission(io);

// Démarrage du monitoring des taux de change en temps réel
 
socketEmission.RateOnRealTime();
 
const orderController = require("./makeOrder.js");
const rateController = require("./getRate.js");
const ordersListController = require("./listOrders.js");

const PORT = 3000;

// Middleware
//JSON
expressApp.use(express.json());
//Limiter
expressApp.use(limiter);
//helmet
//expressApp.use(helmet());

// Masque la source
//expressApp.disable('x-powered-by');

/**
 * Gestion des connexions Socket.io
 */
io.on('connection', (socket) => {
//  console.log('New connexion:', socket.id);
});

/**
 * Route GET pour lister les ordres avec pagination
 * @name GET /api/order/:page
 * @param {number} page - Numéro de page (optionnel, défaut: 1)
 * @returns {Object} Réponse contenant les ordres et les métadonnées de pagination
 */
expressApp.get('/api/order/:page', (req, res) => {
    const page = parseInt(req.params.page) || 1;
    
    ordersListController.listOrders(page)
        .then((response) => {
            res.send(response);
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: "Internal server error" });
        });
});

/**
 * Route POST pour créer un nouvel ordre
 * @name POST /api/order
 * @param {string} type - Type d'ordre ('ask', 'bid' ou 'limit')
 * @param {number} amount - Montant à échanger
 * @param {string} [from="BNB"] - Cryptomonnaie source (défaut: BNB)
 * @param {string} [to="TRX"] - Cryptomonnaie cible (défaut: TRX)
 * @param {number} [price=0] - Prix pour les ordres limit (défaut: 0)
 * @returns {Object} Détails de l'ordre créé
 */
expressApp.post('/api/order', (req, res) => {
    const { amount, type, from = "BNB", to = "TRX", price = 0 } = req.body;

    if (!type || !amount) {
        return res.status(400).json({ message: 'Type and amount are required' });
    }

    orderController.sendOrder(price, amount, type, from, to)
        .then((response) => {
            res.send(response);
        })
        .catch(error => {
            console.error('Error creating order:', error);
            res.status(500).json({ error: "Internal server error" });
        });
});

/**
 * Route GET pour obtenir un taux de change
 * @name GET /api/rate/:from/:to/:amount
 * @param {string} from - Cryptomonnaie source
 * @param {string} to - Cryptomonnaie cible
 * @param {number} [amount=1] - Montant à convertir (défaut: 1)
 * @returns {Object} Détails du taux de change calculé
 */
expressApp.get('/api/rate/:from/:to/:amount', (req, res) => {
    const { from, to } = req.params;
    const amount = req.params.amount || 1;

    if (!from || !to) {
        return res.status(400).json({ error: "From and to parameters are required" });
    }

    rateController.getRate(from.toUpperCase(), to.toUpperCase(), amount)
        .then((response) => {
            res.send(response);
        })
        .catch(error => {
            console.error('Error fetching rate:', error);
            res.status(500).json({ error: "Internal server error" });
        });
});

/**
 * Route GET pour le suivi en temps réel des ordres et taux
 * @name GET /live
 * @returns {file} Page HTML pour le suivi en temps réel
 */
expressApp.get('/live', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

/**
 * Démarrage du serveur principal
 */
server.listen(PORT, () => {
  console.log(`Served Web3 at ${PORT}`);
});
