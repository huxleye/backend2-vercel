const mongoose = require('mongoose');

// Cache untuk koneksi database
const dbConnections = {};

// Fungsi untuk menghubungkan ke database yang ditentukan
async function connectToDatabase(databaseName, url) {
 if (dbConnections[databaseName]) {
  // Koneksi sudah ada, gunakan koneksi yang telah dicache
  return dbConnections[databaseName];
 }

 console.log(url.replace('piketDB', databaseName));

 // Buat koneksi baru dan simpan di cache
 const connection = await mongoose.createConnection(url.replace('piketDB', databaseName));
 dbConnections[databaseName] = connection;
 console.log(`Connected to ${databaseName} database`);
 return connection;
}

module.exports = { connectToDatabase };
