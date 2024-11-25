const { connectToDatabase } = require('./multiDB');
const mongoose = require('mongoose');

// Cache untuk model per database dan nama koleksi
const modelCache = {};

// Middleware untuk memilih database dan menyediakan fungsi getModel untuk mengakses model dinamis
async function dbSelectorMiddleware(req, res, next) {
 let databaseName;
 const url = req.app.config.DatabaseURL;

 // Tentukan database berdasarkan path
 if (req.path.startsWith('/thirdParty/ourclass')) {
  databaseName = 'piketDB';
 } else if (req.path.startsWith('/marselAccount')) {
  databaseName = 'marselAccount';
 } else {
  return res.status(400).json({ error: 'Invalid database path' });
 }

 try {
  // Dapatkan koneksi database
  const dbConnection = await connectToDatabase(databaseName, url);

  // Fungsi untuk mendapatkan model berdasarkan nama koleksi
  req.getModel = (collectionName, schemaDefinition) => {
   const cacheKey = `${databaseName}_${collectionName}`;

   // Jika model sudah ada di cache, gunakan model dari cache
   if (modelCache[cacheKey]) {
    return modelCache[cacheKey];
   }

   // Tambahkan opsi `collection` agar nama koleksi tidak diubah
   const schema = new mongoose.Schema(schemaDefinition, {
    collection: collectionName // Nama koleksi tetap
   });

   // Buat model baru tanpa pluralization
   const model = dbConnection.model(collectionName, schema);
   modelCache[cacheKey] = model;

   return model;
  };

  next();
 } catch (error) {
  console.error(`Error connecting to ${databaseName} database:`, error);
  res.status(500).json({ error: 'Database connection failed' });
 }
}

module.exports = dbSelectorMiddleware;
