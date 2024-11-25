const mongoose = require('mongoose');

// Objek cache untuk menyimpan koneksi ke database
const connections = {};

// Fungsi untuk menghubungkan ke database tertentu
async function connect(client, databaseName) {
 const chalk = await import('chalk');
 mongoose.set('strictQuery', false);

 // Cek apakah sudah ada koneksi ke database ini
 if (connections[databaseName]) {
  console.log(
   chalk.default.blue(chalk.default.bold(`Database`)),
   chalk.default.white(`>>`),
   chalk.default.white('✔️ '),
   chalk.default.red(`MongoDB`),
   chalk.default.greenBright(`is already connected to '${databaseName}'!`)
  );
  return connections[databaseName];
 }

 // Jika belum ada koneksi, buat koneksi baru
 try {
  console.time('Database Connected!');
  console.log(
   chalk.default.blue(chalk.default.bold(`Database`)),
   chalk.default.white(`>>`),
   chalk.default.white('❌'),
   chalk.default.red(`MongoDB`),
   chalk.default.redBright(`is connecting ····`)
  );

  // Buat koneksi baru ke database yang ditentukan
  const connection = await mongoose.createConnection(
   client.config.DatabaseURL.replace('piketDB', databaseName)
  );

  // Simpan koneksi ke cache
  connections[databaseName] = connection;

  console.log(
   chalk.default.blue(chalk.default.bold(`Database`)),
   chalk.default.white(`>>`),
   chalk.default.white('✔️ '),
   chalk.default.red(`MongoDB`),
   chalk.default.greenBright(`is connected to '${databaseName}'!`)
  );
  console.timeEnd('Database Connected!');

  return connection;
 } catch (error) {
  console.log(
   chalk.default.blue(chalk.default.bold(`Database`)),
   chalk.default.white(`>>`),
   chalk.default.white('✖'),
   chalk.default.red(`MongoDB`),
   chalk.default.red(`Error while connecting to MongoDB, throwing ${chalk.default.bgRed('error.')}`)
  );
  throw error;
 }
}

// Fungsi untuk menutup semua koneksi database saat server berhenti
async function closeAllConnections() {
 for (const dbName in connections) {
  await connections[dbName].close();
 }
 console.log('All database connections closed');
}

module.exports = { connect, closeAllConnections };
