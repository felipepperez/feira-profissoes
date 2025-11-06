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
  const [activeGames, setActiveGames] = useState([]);
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
      
      const getSocketUrl = () => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Se estiver em localhost, usar porta 3001 (desenvolvimento)
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:3001';
        }
        
        // Se estiver na porta 80 (portal cativo), usar a mesma porta
        // Se não tiver porta especificada (porta 80 padrão), usar porta 80
        if (port === '' || port === '80') {
          return `http://${hostname}`;
        }
        
        // Caso contrário, usar a porta especificada
        return `http://${hostname}:${port}`;
      };
      
      const newSocket = io(getSocketUrl());
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('dashboard-join', { password: ADMIN_PASSWORD });
      });

      newSocket.on('dashboard-state', ({ players, leaderboard, activeGamesCount, activeGames }) => {
        setPlayers(players || []);
        setLeaderboard(leaderboard || []);
        setActiveGamesCount(activeGamesCount || 0);
        setActiveGames(activeGames || []);
      });

      newSocket.on('player-joined', ({ players, leaderboard }) => {
        setPlayers(players || []);
        setLeaderboard(leaderboard || []);
      });

      newSocket.on('player-left', ({ players, leaderboard, activeGamesCount, activeGames }) => {
        setPlayers(players || []);
        setLeaderboard(leaderboard || []);
        setActiveGamesCount(activeGamesCount || 0);
        setActiveGames(activeGames || []);
      });

      newSocket.on('game-status-update', ({ activeGamesCount, leaderboard, activeGames }) => {
        setActiveGamesCount(activeGamesCount || 0);
        setLeaderboard(leaderboard || []);
        setActiveGames(activeGames || []);
      });

      newSocket.on('leaderboard-update', ({ leaderboard, activeGamesCount, activeGames }) => {
        setLeaderboard(leaderboard || []);
        setActiveGamesCount(activeGamesCount || 0);
        setActiveGames(activeGames || []);
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
        <div>
          <div className="stats-grid-compact">
            <div className="stat-card-compact">
              <h3>Jogadores Conectados</h3>
              <div className="stat-value-compact">{players.length}</div>
            </div>
            <div className="stat-card-compact">
              <h3>Jogos Ativos</h3>
              <div className="stat-value-compact">{activeGamesCount}</div>
            </div>
          </div>

          {activeGames.length > 0 && (
            <div className="leaderboard" style={{ marginTop: '1.5rem' }}>
              <h3>🎮 Jogadores em Jogo (Tempo Real)</h3>
              {activeGames.map((game, index) => (
                <div key={index} className="leaderboard-item" style={{ backgroundColor: index === 0 ? '#f0f8ff' : 'transparent' }}>
                  <span>
                    {index === 0 && '🔥'}
                    {' '}
                    {game.playerName} - Desafio {game.challengeNumber}
                  </span>
                  <span style={{ fontWeight: 'bold', color: index === 0 ? '#667eea' : '#333' }}>
                    {game.currentScore} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="leaderboard" style={{ marginTop: activeGames.length > 0 ? '1.5rem' : '1.5rem' }}>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="qrcode-container">
            <h3 style={{ marginBottom: '1rem', color: '#333', textAlign: 'center', fontSize: '1rem' }}>
              📶 Conectar ao Wi-Fi
            </h3>
            <div style={{ 
              background: 'white', 
              padding: '1rem', 
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <QRCode 
                value={`WIFI:T:WPA;S:${wifiSSID};P:${wifiPassword};;`}
                size={180}
                style={{ marginBottom: '0.5rem' }}
              />
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#666', 
                textAlign: 'center',
                marginTop: '0.5rem',
                fontWeight: 'bold'
              }}>
                Rede: {wifiSSID}
              </p>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#999', 
                textAlign: 'center'
              }}>
                Senha: {wifiPassword}
              </p>
            </div>
          </div>

          <div className="qrcode-container">
            <h3 style={{ marginBottom: '1rem', color: '#333', textAlign: 'center', fontSize: '1rem' }}>
              📱 Acessar o Quiz
            </h3>
            <div style={{ 
              background: 'white', 
              padding: '1rem', 
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <QRCode 
                value={quizUrl}
                size={180}
                style={{ marginBottom: '0.5rem' }}
              />
              <p style={{ 
                fontSize: '0.75rem', 
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
    </div>
  );
};

export default AdminDashboard;