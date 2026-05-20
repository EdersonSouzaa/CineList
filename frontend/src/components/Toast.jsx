import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`toast ${type}`}>
      {icons[type]}
      <span style={{ fontSize: '0.9rem', flex: 1 }}>{message}</span>
      <button 
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: 'inherit', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center',
          padding: '0.2rem',
          opacity: 0.8
        }} 
        onClick={onClose}
        aria-label="Fechar"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
