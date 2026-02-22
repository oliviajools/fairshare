const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Apple Sign In Konfiguration
const TEAM_ID = '6G948G5USL';
const KEY_ID = '87U3TF2KVC';
const CLIENT_ID = 'com.teampayer.app.client'; // Deine Services ID

// Key-Datei lesen
const keyPath = path.join(__dirname, '../ios/AuthKey_87U3TF2KVC.p8');
const privateKey = fs.readFileSync(keyPath, 'utf8');

// JWT generieren (gültig für 6 Monate - Maximum von Apple)
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: TEAM_ID,
  subject: CLIENT_ID,
  keyid: KEY_ID,
});

console.log('\n=== APPLE SECRET GENERIERT ===\n');
console.log('Füge folgende Zeilen zu deiner .env hinzu:\n');
console.log(`APPLE_ID="${CLIENT_ID}"`);
console.log(`APPLE_SECRET="${token}"`);
console.log('\n⚠️  Dieses Secret läuft in 6 Monaten ab und muss dann neu generiert werden.\n');
