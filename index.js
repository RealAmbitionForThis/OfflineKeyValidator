const CryptoJS = require('crypto-js');
const elliptic = require('elliptic');
const crypto = require('crypto');

const EC = elliptic.ec;

const ec = new EC('secp256k1');

const SCRAMBLERS = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];

function multiHash(data) {
    console.log("Input data:", data);

    const sha256Result = CryptoJS.SHA256(data).toString();
    console.log("SHA-256 Result:", sha256Result);

    const finalHash = CryptoJS.SHA512(sha256Result).toString();
    console.log("Final Hash:", finalHash);

    return finalHash;
}

function generateKeyPair(domainName, browserFingerprint) {
    const domainHash = multiHash(domainName, browserFingerprint);

    const keyPair = ec.keyFromPrivate(domainHash.slice(0, 64), 'hex');
    const publicKey = keyPair.getPublic('hex');
    const privateKey = keyPair.getPrivate('hex');

    return { privateKey, publicKey };
}

function generateApiKey(appId, domainName, privateKey, version = 1, expiryInDays = 14) {
    const masterKey = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const expiryTimestamp = (Date.now() + expiryInDays * 24 * 60 * 60 * 1000).toString();
    const combined = `${appId}:${domainName}:${expiryTimestamp}`;
    const multiHashed = multiHash(combined);
    const signatureDER = ec.keyFromPrivate(privateKey).sign(multiHashed).toDER();
    const signatureHex = Buffer.from(signatureDER).toString('hex');

    const scrambler = SCRAMBLERS[Math.floor(Math.random() * SCRAMBLERS.length)];
    return `${version}${scrambler}${masterKey}${scrambler}${signatureHex}${scrambler}${expiryTimestamp}`;
}

function isValidApiKey(appId, domainName, apiKey, publicKey) {
    const version = parseInt(apiKey[0]);
    if (version !== 1) return false;

    const scrambler = apiKey[1];
    const [masterKey, signatureHex, expiryTimestamp] = apiKey.slice(2).split(scrambler);

    const combined = `${appId}:${domainName}:${expiryTimestamp}`;
    const multiHashed = multiHash(combined);
    console.log("MultiHashed:", multiHashed);

    const signatureDER = Buffer.from(signatureHex, 'hex');
    return ec.keyFromPublic(publicKey, 'hex').verify(multiHashed, signatureDER);
}

function extractApiKeyInfo(apiKey, privateKey, publicKey) {
    if (!SCRAMBLERS.includes(apiKey[1])) return null;

    const scrambler = apiKey[1];
    const [masterKey, signatureHex, expiryTimestamp] = apiKey.slice(2).split(scrambler);

    const signatureDER = Buffer.from(signatureHex, 'hex');

    for (let i = 0; i < 100; i++) {  // app IDs 0 - 99
        for (const domain of ['loc.com', '123.com']) {
            const combined = `${i}:${domain}:${expiryTimestamp}`;
            const multiHashed = multiHash(combined);

            if (ec.keyFromPublic(publicKey, 'hex').verify(multiHashed, signatureDER)) {
                return { appId: i.toString(), domainName: domain, expiryTimestamp: parseInt(expiryTimestamp) };
            }
        }
    }

    return null;
}

//const { privateKey, publicKey } = generateKeyPair("example.com", "1212bh12");
let privateKey = 'a744b24f4e8f26a9b6775cf6aa348e8313f137f4c8613d0acf2141b9e0d8c233'
let publicKey = '04c5f8def37440be7c72514295aedd2b525dfbcecb2274bc65dbfc5c9e4f086d992e63f6394c8eb49c57546972a7136b312c91d2490b56222c331d8bd349825c87'
let apiKey = '1^aef868bd912ed23c81b4a598f501d9a7^304502200e5725df2ed28bf95e63e7a62d19d0df90f917892152ad7f278ce8869ac63946022100cd49cf92250be7aaee69150b963cb6d842816e2c1f64b7af74e1d6c652b1058d^1696285800948'
console.log(`Private Key: ${privateKey}`);
console.log(`Public Key: ${publicKey}`);

//const apiKey = generateApiKey('12', 'example.com', privateKey, 1, 14);
console.log(`Generated Key: ${apiKey}`);
console.log(`Is Valid: ${isValidApiKey('12', 'example.com', apiKey, publicKey)}`);
console.log(extractApiKeyInfo(apiKey, privateKey, publicKey));

module.exports = {
    multiHash,
    generateKeyPair,
    generateApiKey,
    isValidApiKey,
    extractApiKeyInfo
};