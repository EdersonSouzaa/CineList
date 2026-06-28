import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'cinelist-secret-key-1234567890';

// Converte string para base64 url-safe
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Converte base64 url-safe de volta para string
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

export const jwt = {
  // Gera um token JWT
  sign(payload, expiresInSeconds = 604800) { // Default 7 dias
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64url(JSON.stringify(header));
    
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const fullPayload = { ...payload, exp };
    const encodedPayload = base64url(JSON.stringify(fullPayload));
    
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${encodedHeader}.${encodedPayload}`);
    const signature = base64url(hmac.digest());
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },

  // Valida e decodifica o token JWT
  verify(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const [encodedHeader, encodedPayload, signature] = parts;
      
      // Valida assinatura
      const hmac = crypto.createHmac('sha256', JWT_SECRET);
      hmac.update(`${encodedHeader}.${encodedPayload}`);
      const expectedSignature = base64url(hmac.digest());
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      const payload = JSON.parse(base64urlDecode(encodedPayload));
      
      // Verifica expiração
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (payload.exp && currentTimestamp > payload.exp) {
        return null; // Token expirado
      }
      
      return payload;
    } catch (error) {
      console.error('Erro ao verificar JWT:', error);
      return null;
    }
  }
};
