import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Dashboard = ({ onBack }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    status: 'waiting',
    currentChallenge: null,
    challengeIndex: 0
  });
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeGamesCount, setActiveGamesCount] = useState(0);

  useEffect(() => {
    const getSocketUrl = () => {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      return `http://${hostname}:3001`;
    };
    
    const newSocket = io(getSocketUrl());
    setSocket(newSocket);

    newSocket.emit('dashboard-join');

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

    return () => {
      newSocket.close();
    };
  }, []);


  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <button onClick={onBack} className="back-btn">Voltar</button>
      </div>

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

      {leaderboard.length > 0 && (
        <div className="leaderboard">
          <h3>🏆 Ranking</h3>
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

export default Dashboard;
