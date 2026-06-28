import crypto from 'crypto';

export const hash = {
  // Cria um hash de senha usando SHA256 com um salt fixo
  hashPassword(password) {
    const salt = 'cinelist-salt-98765';
    return crypto
      .createHmac('sha256', salt)
      .update(password)
      .digest('hex');
  },

  // Verifica se a senha corresponde ao hash salvo
  compare(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }
};
