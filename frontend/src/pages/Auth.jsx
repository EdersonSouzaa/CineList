import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { supabase } from '../services/supabase.js';

export const Auth = ({ addToast }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isSignUp) {
      if (!name.trim()) {
        addToast('O campo Nome é obrigatório.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        addToast('As senhas não coincidem!', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name.trim()
            }
          }
        });
        if (error) throw error;
        addToast('Conta criada! Se o seu projeto exigir confirmação de e-mail, verifique sua caixa de entrada.', 'info', 6000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        addToast('Seja bem-vindo de volta!', 'success');
      }
    } catch (error) {
      console.error('Erro de autenticação:', error);
      addToast(error.message || 'Erro ao autenticar. Verifique seus dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h1 className="auth-logo">CineList</h1>
          <p className="auth-subtitle">
            {isSignUp 
              ? 'Cadastre-se para começar a favoritar e avaliar filmes' 
              : 'Faça login para acessar sua biblioteca de favoritos'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">Nome</label>
              <div className="input-wrapper">
                <User className="input-icon" size={16} />
                <input
                  id="name-input"
                  type="text"
                  className="form-input"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">E-mail</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={16} />
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder="exemplo@cinema.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={16} />
              <input
                id="password-input"
                type="password"
                className="form-input"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password-input">Confirmar Senha</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  id="confirm-password-input"
                  type="password"
                  className="form-input"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={isSignUp}
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? 'Processando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <div className="auth-toggle-text">
          {isSignUp ? 'Já possui cadastro?' : 'Novo por aqui?'}
          <button className="btn-auth-toggle" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Entrar na conta' : 'Criar uma conta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
