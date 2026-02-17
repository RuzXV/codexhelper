function urlSafeBase64Decode(str: string): Uint8Array {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const outputArray = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
        outputArray[i] = raw.charCodeAt(i);
    }
    return outputArray;
}

export async function decryptFernetToken(encodedKey: string, encodedToken: string): Promise<string> {
    const keyBytes = urlSafeBase64Decode(encodedKey);
    const tokenBytes = urlSafeBase64Decode(encodedToken);

    const masterKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HKDF' }, false, ['deriveKey']);

    const salt = new Uint8Array(0);
    const signingKey = await crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: salt, info: new TextEncoder().encode('hono-auth-signing-key') },
        masterKey,
        { name: 'HMAC', hash: 'SHA-256', length: 128 },
        true,
        ['sign', 'verify'],
    );
    const encryptionKey = await crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: salt, info: new TextEncoder().encode('hono-auth-encryption-key') },
        masterKey,
        { name: 'AES-CBC', length: 128 },
        true,
        ['encrypt', 'decrypt'],
    );

    const iv = tokenBytes.slice(9, 25);
    const ciphertext = tokenBytes.slice(25, tokenBytes.length - 32);
    const hmacSignature = tokenBytes.slice(tokenBytes.length - 32);

    const dataToSign = tokenBytes.slice(0, tokenBytes.length - 32);
    const isValid = await crypto.subtle.verify({ name: 'HMAC' }, signingKey, hmacSignature, dataToSign);

    if (!isValid) {
        throw new Error('Fernet token signature mismatch. Token is invalid or tampered.');
    }

    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, encryptionKey, ciphertext);

    return new TextDecoder().decode(decryptedData);
}

function urlSafeBase64Encode(buf: Uint8Array): string {
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(buf)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function encryptFernetToken(encodedKey: string, plaintext: string): Promise<string> {
    const keyBytes = urlSafeBase64Decode(encodedKey);

    const masterKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HKDF' }, false, ['deriveKey']);

    const salt = new Uint8Array(0);
    const signingKey = await crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: salt, info: new TextEncoder().encode('hono-auth-signing-key') },
        masterKey,
        { name: 'HMAC', hash: 'SHA-256', length: 128 },
        true,
        ['sign', 'verify'],
    );
    const encryptionKey = await crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: salt, info: new TextEncoder().encode('hono-auth-encryption-key') },
        masterKey,
        { name: 'AES-CBC', length: 128 },
        true,
        ['encrypt', 'decrypt'],
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const plaintextBytes = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv }, encryptionKey, plaintextBytes);

    const version = new Uint8Array([0x80]);
    const timestamp = new Uint8Array(8);
    const time = BigInt(Math.floor(Date.now() / 1000));
    new DataView(timestamp.buffer).setBigUint64(0, time, false);

    const preSignaturePayload = new Uint8Array(version.length + timestamp.length + iv.length + ciphertext.byteLength);
    preSignaturePayload.set(version, 0);
    preSignaturePayload.set(timestamp, 1);
    preSignaturePayload.set(iv, 9);
    preSignaturePayload.set(new Uint8Array(ciphertext), 25);

    const hmacSignature = await crypto.subtle.sign({ name: 'HMAC' }, signingKey, preSignaturePayload);

    const finalTokenBytes = new Uint8Array(preSignaturePayload.length + hmacSignature.byteLength);
    finalTokenBytes.set(preSignaturePayload, 0);
    finalTokenBytes.set(new Uint8Array(hmacSignature), preSignaturePayload.length);

    return urlSafeBase64Encode(finalTokenBytes);
}
