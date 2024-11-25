// const http = require('http');

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello, World!');
// });

// server.listen(process.env.PORT || 3000, 'localhost', () => {
//   console.log(`server listen at: ${process.env.PORT || 3000}`);
// });

const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

var PORT = process.env.PORT || '9009';

// Enable CORS for all routes
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

app.config = require("./config.json");

//! UNIVERSAL
function generateRandomString(length = 15) {
 const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
 let result = '';

 for (let i = 0; i < length; i++) {
  const randomIndex = Math.floor(Math.random() * characters.length);
  result += characters[randomIndex];
 }

 return result;
}

//! MongoDB connection
const { connect, closeAllConnections } = require("./public/Database/Connect");
// connect(app, 'piketDB')

const dbSelectorMiddleware = require('./public/Database/dbMiddleware');
app.use(dbSelectorMiddleware);

//! API LOG Communicate to Database. (PIKET)
const logSchema = new mongoose.Schema({
 date: { type: Date, required: true },
 studentName: { type: String, required: true },
 classList: { type: String, required: true },
 attendance: { type: String, required: true },
 addBy: { type: String, required: true },
 referenceId: { type: String, unique: true },
 editLog: [{
  editFrom: { type: String },
  editWhen: { type: Date },
  editTo: { type: String },
  modifiedBy: { type: String },
 }]
});

const Log = mongoose.model('logs', logSchema)

// API to submit new log
app.post('/api/logs/', async (req, res) => {
 const { date, studentName, classList, attendance, addBy } = req.body;
 try {
  const newLog = new Log({ date, studentName, classList, attendance, addBy });

  await newLog.save();

  newLog.referenceId = generateRandomString(15);

  await newLog.save();

  console.log(newLog);

  res.status(201).json(newLog);
 } catch (error) {
  res.status(500).json({ message: 'Failed to save log', error });
 }
});

// API to get all logs
app.get('/api/logs', async (req, res) => {
 try {
  const logs = await Log.find();
  // console.log(logs)
  res.status(200).json(logs);
 } catch (error) {
  res.status(500).json({ message: 'Failed to retrieve logs', error });
 }
});

// API to edit a log
app.put('/api/logs/:referenceId', async (req, res) => {
 const { referenceId } = req.params;
 const { date, studentName, classList, attendance, modifiedBy, originalName, originalClass, originalAttendance } = req.body;

 try {
  // Find the log entry by referenceId
  // const oldLog = await Log.findOne({ referenceId });
  const log = await Log.findOne({ referenceId });

  if (!log) {
   return res.status(404).json({ message: 'Log not found' });
  }

  const oldLog = { ...log.toObject() };

  // Update the log entry
  log.date = date;
  log.studentName = studentName;
  log.classList = classList;
  log.attendance = attendance;

  // Prepare variables to hold changes
  const editFromArray = [];
  const editToArray = [];
  const editWhen = new Date(); // Store the time of editing

  // Gather changes
  // Check for date change
  // console.log(oldLog, log, oldLog.date.toJSON(), log.date.toJSON(), oldLog.date.toJSON() !== log.date.toJSON());

  if (oldLog.date.toJSON() !== log.date.toJSON()) {
   editFromArray.push(oldLog.date);
   editToArray.push(log.date);
  } else {
   editFromArray.push(''); // No change, push empty string
   editToArray.push('');   // No change, push empty string
  }
  // Check for studentName change
  if (oldLog.studentName !== log.studentName) {
   editFromArray.push(oldLog.studentName);
   editToArray.push(log.studentName);
  } else {
   editFromArray.push(''); // No change, push empty string
   editToArray.push('');   // No change, push empty string
  }
  // Check for classList change
  if (oldLog.classList !== log.classList) {
   editFromArray.push(oldLog.classList);
   editToArray.push(log.classList);
  } else {
   editFromArray.push(''); // No change, push empty string
   editToArray.push('');   // No change, push empty string
  }

  // Check for attendance change
  if (oldLog.attendance !== log.attendance) {
   editFromArray.push(oldLog.attendance);
   editToArray.push(log.attendance);
  } else {
   editFromArray.push(''); // No change, push empty string
   editToArray.push('');   // No change, push empty string
  }

  // Siapkan update jika ada perubahan
  const updateData = {
   date,
   studentName,
   classList,
   attendance,
   referenceId,
  };

  // Update `editLog` hanya jika ada perubahan
  const editFrom = editFromArray.join(',');
  const editTo = editToArray.join(',');

  updateData.editLog = [
   ...log.editLog,
   { editFrom, editTo, editWhen, modifiedBy },
  ];

  // console.log(oldLog, log, updateData);

  // Overwrite data tanpa membuat dokumen baru
  await Log.updateMany({ referenceId }, updateData);

  res.status(200).json(log);
 } catch (error) {
  res.status(500).json({ message: 'Failed to update log entry', error });
 }
});

// API to delete a log
app.delete('/api/logs/:id', async (req, res) => {
 const { id } = req.params;
 try {
  // await Log.findByIdAndDelete(id);

  // res.status(204).end();

  const deletedLog = await Log.findOneAndDelete({
   referenceId: id,
  });

  if (!deletedLog) {
   return res.status(404).json({ message: 'Log not found' });
  }

  res.status(204).end();

 } catch (error) {
  res.status(500).json({ message: 'Failed to delete log', error });
 }
});

// Test API
app.get('/api', (req, res) => {
 res.send('Hello?')
})

//! API LOG Communicate to Database. (LOGIN)
const userSchema = new mongoose.Schema({
 displayName: { type: String, required: true },
 username: { type: String, required: true, unique: true },
 password: { type: String, required: true },
 ihiu: { type: String, required: false },
 role: { type: String, default: 'User' },
 canEdit: { type: Boolean, default: false, required: false },
 classEdit: { type: String, required: true },
 sessionId: { type: Array, default: [] },
 maxLogin: { type: String, required: true }
});

const userSchema1 = {
 displayName: { type: String, required: true },
 username: { type: String, required: true, unique: true },
 password: { type: String, required: true },
 ihiu: { type: String, required: false },
 role: { type: String, default: 'User' },
 canEdit: { type: Boolean, default: false, required: false },
 classEdit: { type: String, required: true },
 sessionId: { type: Array, default: [] },
 maxLogin: { type: String, required: true }
};

// const User = mongoose.model('User', userSchema);

app.post('/thirdParty/ourclass/login', async (req, res) => {
 const { username, password } = req.body;

 try {
  const User = await req.getModel('users', userSchema1);
  const user = await User.findOne({ username });

  if (!user) return res.status(200).json({ message: 'User not found', error: true, code: 401 });

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return res.status(401).json({ message: 'Invalid password', error: true });

  const sessionId = uuidv4();

  if (user.sessionId.length >= user.maxLogin) {
   // await User.updateOne({ sessionId }, { $pull: { sessionId } });
   await User.updateOne(
    { username },
    { $pop: { sessionId: -1 } } // -1 untuk menghapus elemen pertama
   );
  }

  user.sessionId.push(sessionId);
  await user.save();

  res.cookie('sessionId', sessionId, { httpOnly: true });
  res.json({ error: false, success: true, message: 'Login successful', sessionId });
 } catch (error) {
  res.status(500).send('Error logging in: ' + error.message);
 }
});

app.post('/thirdParty/ourclass/logout', async (req, res) => {
 const { sessionIdToRemove, usernameAccount } = req.body;

 try {
  const User = await req.getModel('users', userSchema1);
  const result = await User.updateOne(
   { username: usernameAccount },
   { $pull: { sessionId: sessionIdToRemove } }
  );

  // console.log(result)

  res.clearCookie('sessionId');
  res.status(200).json({ message: 'Logged out successfully', action: 'logout', result });
 } catch (error) {
  res.status(500).send('Logout error: ' + error.message);
 }
});

app.get('/thirdParty/ourclass/api/verify-session', async (req, res) => {
 const sessionId = req.query.sessionId;

 try {
  const User = await req.getModel('users', userSchema1);
  const user = await User.findOne({ sessionId: sessionId });

  if (user) {
   res.status(200).json({ valid: true, username: user.username, user });
  } else {
   res.status(200).json({ valid: false, code: 401 })
   // res.status(401).json({ valid: false });
  }
 } catch (error) {
  console.error('Error verifying session:', error);
  res.status(500).json({ valid: false, error: 'Server error' });
 }
});

//! CREATE USER
app.post('/createUser', async (req, res) => {
 const { username, password, role, canEdit, classEdit, maxLogin, displayName } = req.body;

 try {
  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
  const newUser = new User({
   username,
   password: hashedPassword,
   ihiu: password,
   role,
   canEdit: canEdit,
   classEdit,
   maxLogin,
   displayName
  });

  await newUser.save();

  res.json({ ok: true, newUser })

  // const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;

  // res.redirect(`${origin}/login`);
 } catch (error) {
  res.status(500).send('Error creating user: ' + error.message);
 }
});

//? Get latest User
app.post('/thirdParty/ourclass/users', async (req, res) => {
 const { userId, action, username } = req.body;

 const User = await req.getModel('users', userSchema1);

 try {
  if (action == "logoutAll") {
   const user = await User.findOne({ username });

   user.sessionId = [];
   await user.save();

   // console.log(user)

   res.json({ success: true });
  } else if (userId) {
   const user = await User.findById(userId);
   res.json(user);
  } else {
   const users = await User.find();
   res.json(users);
  }
 } catch (error) {
  res.status(500).send('Error fetching users: ' + error.message);
 }
})

//? Update user
app.put('/users/:id', async (req, res) => {
 const { username, role, canEdit, classEdit, password, maxLogin, displayName } = req.body;

 try {
  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await User.findByIdAndUpdate(
   req.params.id,
   { username, role, canEdit: canEdit, classEdit, password: hashedPassword, ihiu: password, maxLogin, displayName },
   { new: true }
  );

  const users = await User.find();

  res.json({ updatedUser, users, success: true });
 } catch (error) {
  res.status(500).send('Error updating user: ' + error.message);
 }
});

//? Hapus user
app.delete('/users/:id', async (req, res) => {
 try {
  await User.findByIdAndDelete(req.params.id);
  res.send('User deleted');
 } catch (error) {
  res.status(500).send('Error deleting user: ' + error.message);
 }
});

//? Marsel Account
const marselAccountSchema = {
 displayName: { type: String, required: true },
 username: { type: String, required: true, unique: true },
 email: { type: String, required: true, unique: true },
 schoolEmail: { type: String, required: true },
 password: { type: String, required: true },
 ihiu: { type: String, required: false },
 integrationTo: [
  {
   sessionId: { type: String, required: true },
   integrationTo: { type: String, required: true },
   expiredSession: { type: Date, required: true }
  }
 ],
 sessionId: { type: [String], default: [] },
 maxLogin: { type: String, required: true },
 accountId: { type: String, required: true },
};

const marselAccountAppNameSchema = {
 verifiedApp: { type: Boolean, required: true, default: false },
 appName: { type: String, required: true },
 appId: { type: String, required: true },
 privacyPolicyLink: { type: String, required: true },
 TOSLink: { type: String, required: true },
 appLink: { type: String, required: true },
 integrationSession: [
  {
   sessionId: { type: String, required: true },
   emailCache: { type: String, default: '' }
  }
 ],
 appIcon: { type: String, required: true },
};

const sessionHelperSchema = {
 sessionHelper: { type: String, required: true },
 accountSaved: [
  {
   timeExpired: { type: Date, required: true, default: '' },
   accountId: { type: String, required: true, default: '' },
  }
 ]
}

app.post('/marselAccount', async (req, res) => {
 const { action, account, password, appLink, appId, email, sessionId, sessionHelperId } = req.body;

 const marselAccountAppName = await req.getModel('marselAccountAppName', marselAccountAppNameSchema);
 const marselAccountModel = await req.getModel('marselAccount', marselAccountSchema);
 const sessionHelperModel = await req.getModel('sessionHelperStorage', sessionHelperSchema);

 try {
  const fetchWithTimeout = new Promise(async (resolve, reject) => {
   // Jika berhasil menemukan data, resolve
   const marselAccountApp = await marselAccountAppName.findOne({ appLink });

   if (marselAccountApp) {
    resolve(marselAccountApp);
   } else {
    reject(new Error("Data not found"));
   }
  });

  // Timeout jika tidak selesai dalam 10 detik
  const timeout = new Promise((_, reject) =>
   setTimeout(() => reject(new Error("Request timed out")), 10000)
  );

  // Gunakan Promise.race untuk menunggu salah satu selesai lebih dulu
  const marselAccountApp = await Promise.race([fetchWithTimeout, timeout]);

  if (action == "fetchIntegration") { //! Init the Session to Login with ThirdParty Website
   const sessionId = uuidv4();

   if (marselAccountApp.integrationSession.length >= 3) {
    // console.log(marselAccountApp.integrationSession)
    marselAccountApp.integrationSession.shift();
    await marselAccountApp.save();
   }

   marselAccountApp.integrationSession.push({ sessionId });
   await marselAccountApp.save();

   res.json({ code: 200, message: 'OK', fullData: marselAccountApp, sessionId });
  }

  if (action == 'getAppDetails') { //! Get app Details for Marsel Account
   const marselAccountAppDetail = await marselAccountAppName.findOne({ appId });

   const sessionHelper = await sessionHelperModel.findOne({ sessionHelper: sessionHelperId });

   if (!sessionHelper) {
    const newSessionHelper = new sessionHelperModel({
     sessionHelper: sessionHelperId,
     accountSaved: []
    });

    await newSessionHelper.save();
   } else {
   }

   res.json({ code: 202, message: 'OK', data: marselAccountAppDetail })
  }

  if (action == 'checkEmail') { //! Check Email for Login Marsel Account
   var message;
   const marselAccountAppDetail = await marselAccountAppName.find();
   const marselAccount = await marselAccountModel.find()

   var dataSearched;
   await marselAccount.forEach((log, index) => {
    if (log.email == email || log.schoolEmail == email) {
     return dataSearched = log;
    }
   })

   var sessionValidation;
   await marselAccountAppDetail.forEach((log, index) => {
    if (log.integrationSession) {
     log.integrationSession.forEach((log1, index) => {
      if (log1.sessionId == sessionId) {
       return sessionValidation = log;
      }
     })
    }
   });

   if (sessionValidation !== undefined) {
    await marselAccountAppName.updateOne(
     {
      appId,
      "integrationSession.sessionId": sessionId,
     },
     {
      $set: { "integrationSession.$.emailCache": email }
     }
    )

    if (dataSearched !== undefined) {
     message = { code: 200, data: dataSearched };
    } else {
     message = { code: 401, message: 'Email not found', error: 1, emailError: 1 };
    }
   } else {
    message = { code: 401, message: 'There are invalid between Marsel Account with ThirdParty Website. You may have to back and login again with Marsel Account.', error: 1 };
   }

   res.json(message);
  }

  if (action == "checkPassword") { //! Check Password for Login Marsel Account
   var message;
   const marselAccountAppDetail = await marselAccountAppName.find();
   const marselAccount = await marselAccountModel.find()

   var emailCache;
   await marselAccountAppDetail.forEach((log, index) => {
    if (log.integrationSession) {
     log.integrationSession.forEach((log1, index) => {
      if (log1.sessionId == sessionId) {
       return emailCache = log1.emailCache;
      }
     })
    }
   });

   await marselAccount.forEach((log, index) => {
    if (log.email == emailCache || log.schoolEmail == emailCache) {
     if (log.password == password) {
      return message = { code: 200, message: 'OK', data: log };
     } else {
      return message = { code: 401, message: 'Invalid Password', error: 1, passwordError: 1 };
     }
    }
   })

   res.json(message)
   // res.json({ code: 500 })
  }

  if (action == "login") {
   const marselAccountAppDetail = await marselAccountAppName.find();
   const sessionHelper = await sessionHelperModel.findOne({ sessionHelper: sessionHelperId });

   sessionHelper.accountSaved.push({
    timeExpired: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    accountId: account.accountId,
   });
   // await sessionHelper.save();

   var emailCache;
   await marselAccountAppDetail.forEach((log, index) => {
    if (log.integrationSession) {
     log.integrationSession.forEach((log1, index) => {
      if (log1.sessionId == sessionId) {
       return emailCache = log1.emailCache;
      }
     })
    }
   });

   var marselAccount = await marselAccountModel.find({ email: emailCache });

   if (!marselAccount) marselAccount = await marselAccountModel.find({ schoolEmail: emailCache });

   marselAccount[0].integrationTo.push({
    sessionId,
    integrationTo: `${appLink}/login?sessionId=${sessionId}&provider=MarselAccount`,
    expiredSession: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
   })
   // marselAccount[0].save();

   const doc = await marselAccountAppName.findOne({ appId });
   if (!doc) {
    console.log("AppId tidak ditemukan.");
    return;
   }

   // // Filter array untuk menghapus sessionId
   // const updatedSessions = doc.integrationSession.filter(session => session.sessionId !== sessionId);

   // // Perbarui dokumen dengan array yang difilter
   // const result = await marselAccountAppName.updateOne(
   //  { appId },
   //  { $set: { integrationSession: updatedSessions } }
   // );

   const callbackId = uuidv4();

   res.json({ code: 200, message: 'OK', callbackId, redirect: `marsellAccount://close_s:${callbackId}` });

   // await sessionHelperModel.updateOne(
   //  {
   //   sessionHelper: sessionHelperId,
   //  },
   //  {
   //   $set: { 
   //    "accountSaved.$.": email,
   //   }
   //  }
   // )

  }
 } catch (e) {
  var message;

  if (action == "getAppDetails") {
   message = { code: 500, message: e.message, error: 'Invalid Session', errorId: 2 };
  }

  res.json(message)
  // res.json({ code: 500,  })
  // res.status(500).json({ message: e.message });
 }

 // if (action == "checkEmail") {
 //  const user = await User.findOne({ username: 'marsel' });
 //  res.json({ success: true, user });
 // } else if (action == "login") {
 //  const user = await User.findOne({ username: 'marsel' });
 //  res.json({ success: true, user });
 // }
});

app.get('/', (req, res) => {
 res.send('Huh?')
})

// Menutup semua koneksi database saat server berhenti
process.on('SIGINT', async () => {
 await closeAllConnections();
 process.exit(0);
});

app.listen(PORT, () => {
 console.log(`LISTENED AT http://localhost:${PORT}`)
})
