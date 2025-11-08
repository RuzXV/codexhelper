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
  
    const masterKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );
  
    const salt = new Uint8Array(0);
    const signingKey = await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: salt, info: new TextEncoder().encode('hono-auth-signing-key') },
      masterKey,
      { name: 'HMAC', hash: 'SHA-256', length: 128 },
      true,
      ['sign', 'verify']
    );
    const encryptionKey = await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: salt, info: new TextEncoder().encode('hono-auth-encryption-key') },
      masterKey,
      { name: 'AES-CBC', length: 128 },
      true,
      ['encrypt', 'decrypt']
    );
  
    const iv = tokenBytes.slice(9, 25);
    const ciphertext = tokenBytes.slice(25, tokenBytes.length - 32);
    const hmacSignature = tokenBytes.slice(tokenBytes.length - 32);
  
    const dataToSign = tokenBytes.slice(0, tokenBytes.length - 32);
    const isValid = await crypto.subtle.verify(
      { name: 'HMAC' },
      signingKey,
      hmacSignature,
      dataToSign
    );
  
    if (!isValid) {
      throw new Error('Fernet token signature mismatch. Token is invalid or tampered.');
    }
  
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      encryptionKey,
      ciphertext
    );
    
    return new TextDecoder().decode(decryptedData);
  }