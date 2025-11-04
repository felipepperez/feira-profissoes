import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import QRCode from 'react-qr-code';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeGamesCount, setActiveGamesCount] = useState(0);
  const [quizUrl, setQuizUrl] = useState('');
  const wifiSSID = 'EngSoft';
  const wifiPassword = 'engsoft2025';

  const ADMIN_PASSWORD = 'admin123';
  const AUTH_KEY = 'admin_authenticated';

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    
    const url = window.location.origin;
    setQuizUrl(url);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(AUTH_KEY, 'true');
      const newSocket = io('http://localhost:3001');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('dashboard-join', { password: ADMIN_PASSWORD });
      });

      newSocket.on('dashboard-state', ({ players, leaderboard, activeGamesCount }) => {
        setPlayers(players || []);
        setLeaderboard(leaderboard || []);
        setActiveGamesCount(activeGamesCount || 0);
      });

      newSocket.on('player-joined', ({ players, leaderboard }) => {
        setPlayers(players || []);
        setLeaderboard(leaderboard || []);
      });

      newSocket.on('player-left', ({ players, leaderboard, activeGamesCount }) => {
        setPlayers(players || []);
        setLeaderboard(leaderboard || []);
        setActiveGamesCount(activeGamesCount || 0);
      });

      newSocket.on('game-status-update', ({ activeGamesCount, leaderboard }) => {
        setActiveGamesCount(activeGamesCount || 0);
        setLeaderboard(leaderboard || []);
      });

      newSocket.on('leaderboard-update', ({ leaderboard, activeGamesCount }) => {
        setLeaderboard(leaderboard || []);
        setActiveGamesCount(activeGamesCount || 0);
      });

      newSocket.on('auth-error', ({ message }) => {
        setError(message);
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_KEY);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Senha incorreta!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1>🔐 Dashboard Admin</h1>
          <p>Digite a senha para acessar o dashboard</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
            <button type="submit">Acessar</button>
          </form>
          <button onClick={() => navigate('/')} className="back-link">
            Voltar ao jogo
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard Admin</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleLogout} className="control-btn reset" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Sair
          </button>
          <button onClick={() => navigate('/')} className="back-btn">Voltar ao Jogo</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Jogadores Conectados</h3>
            <div className="stat-value">{players.length}</div>
          </div>
          <div className="stat-card">
            <h3>Jogos Ativos</h3>
            <div className="stat-value">{activeGamesCount}</div>
          </div>
          <div className="stat-card">
            <h3>Total de Jogadores</h3>
            <div className="stat-value">{leaderboard.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="qrcode-container">
            <h3 style={{ marginBottom: '1rem', color: '#333', textAlign: 'center' }}>
              📶 Conectar ao Wi-Fi
            </h3>
            <div style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <QRCode 
                value={`WIFI:T:WPA;S:${wifiSSID};P:${wifiPassword};;`}
                size={200}
                style={{ marginBottom: '1rem' }}
              />
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                textAlign: 'center',
                marginTop: '0.5rem',
                fontWeight: 'bold'
              }}>
                Rede: {wifiSSID}
              </p>
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#999', 
                textAlign: 'center'
              }}>
                Senha: {wifiPassword}
              </p>
            </div>
          </div>

          <div className="qrcode-container">
            <h3 style={{ marginBottom: '1rem', color: '#333', textAlign: 'center' }}>
              📱 Acessar o Quiz
            </h3>
            <div style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <QRCode 
                value={quizUrl}
                size={200}
                style={{ marginBottom: '1rem' }}
              />
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#666', 
                textAlign: 'center',
                wordBreak: 'break-all',
                marginTop: '0.5rem'
              }}>
                {quizUrl}
              </p>
            </div>
          </div>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className="leaderboard">
          <h3>🏆 Ranking Geral</h3>
          {leaderboard.map((entry, index) => (
            <div key={index} className="leaderboard-item">
              <span>
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {' '}
                {index + 1}. {entry.name}
              </span>
              <span>{entry.score} pts</span>
            </div>
          ))}
        </div>
      )}

      {players.length > 0 && (
        <div className="leaderboard" style={{ marginTop: '1rem' }}>
          <h3>👥 Jogadores Online</h3>
          {players.map((player, index) => (
            <div key={index} className="leaderboard-item">
              <span>
                {player.bestScore > 0 ? '🏆' : '⏳'} 
                {' '}
                {player.name}
              </span>
              <span>{player.bestScore || 0} pts (melhor)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;