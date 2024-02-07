function shiftStringBack(str, count) {
    return str.split('').map(char =>
        String.fromCharCode(char.charCodeAt(0) - count)
    ).join('');
}

function deobfuscate(shiftedBase64) {
    const originalBase64 = shiftStringBack(shiftedBase64, 2);
    const decodedHash = atob(originalBase64);
    return decodedHash; // This is the original hash in hex format.
}

const originalHash = deobfuscate(`O|HoQVK4[liyP4G3PYG7\\o[2OoK5QFG3[4S7PoLl\\Fe4\\IG2P4TlOlK3P|jm[lGz\\Vjm[VjmOo[{[oOzQVS3OYS{OVjmQYW|O|O3QIS5OFK{OIO|\\Y\\nQIS5[oK|Olm|O|e4[lO6\\YHmPliy[|m5[YHkOoHnQVW4\\ljnO|Po[o[?`);

console.log(originalHash);