import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createLogger, format, transports } from 'winston';
import promClient from 'prom-client';

// Routes
import authRoutes from './routes/auth.routes.js';
import classesRoutes from './routes/classes.routes.js';
import coursRoutes from './routes/cours.routes.js';
import etudiantsRoutes from './routes/etudiants.routes.js';
import profsRoutes from './routes/profs.routes.js';
import emploiDuTempsRoutes from './routes/emploi-du-temps.routes.js';

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Métriques Prometheus
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register: promClient.register });

// Compteur HTTP personnalisé
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total des requêtes HTTP',
  labelNames: ['method', 'route', 'status']
});

// Histogramme pour le temps de réponse
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'route', 'status'],
  buckets: [1, 5, 15, 50, 100, 200, 500, 1000, 2000]
});

// Logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Middleware pour mesurer les métriques
app.use((req, res, next) => {
  const start = Date.now();
  
  // Intercepter la fin de la réponse pour enregistrer les métriques
  const end = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - start;
    
    // Enregistrer le compteur de requêtes
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode
    });
    
    // Enregistrer la durée de la requête
    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status: res.statusCode
      },
      duration
    );
    
    // Appeler la méthode originale
    res.end = end;
    res.end(chunk, encoding);
  };
  
  next();
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/etudiants', etudiantsRoutes);
app.use('/api/profs', profsRoutes);
app.use('/api/emploi-du-temps', emploiDuTempsRoutes);

// Route pour les métriques Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    logger.error('Erreur lors de la génération des métriques:', err);
    res.status(500).end(err);
  }
});

// Middleware pour gérer les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Middleware pour gérer les erreurs
app.use((err, req, res) => {
  logger.error(`Erreur: ${err.message}`);
  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue sur le serveur',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-etablissement');
    logger.info('Connexion à MongoDB établie');
    return true;
  } catch (err) {
    logger.error('Erreur de connexion à MongoDB:', err);
    return false;
  }
};

// Démarrer le serveur si nous ne sommes pas en mode test
if (process.env.NODE_ENV !== 'test') {
  connectDB().then((connected) => {
    if (connected) {
      app.listen(PORT, () => {
        logger.info(`Serveur démarré sur le port ${PORT}`);
      });
    } else {
      process.exit(1);
    }
  });
}

export { app, connectDB };
