const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // Ajoute cette ligne
const fs = require('fs');
dotenv.config(); // Charge les variables d'environnement depuis le fichier .env

const app = express();
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');
const path = require('path');

dotenv.config();

// Si le fichier .env.local existe, il écrase les valeurs par défaut
const envLocalPath = '.env.local';
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

mongoose.connect(process.env.MONGO_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));
  

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;