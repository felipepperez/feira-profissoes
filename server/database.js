const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'game_data.db');

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao abrir banco de dados:', err);
        reject(err);
        return;
      }
      console.log('Conectado ao banco de dados SQLite');
    });

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          socket_id TEXT NOT NULL,
          best_score INTEGER DEFAULT 0,
          total_games INTEGER DEFAULT 0,
          last_played DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela players:', err);
          reject(err);
        }
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id TEXT NOT NULL,
          player_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(player_id)
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela game_sessions:', err);
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  });
}

function getPlayer(db, playerId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM players WHERE player_id = ?',
      [playerId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

function createOrUpdatePlayer(db, playerId, playerName, socketId, bestScore = 0, totalGames = 0) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO players (player_id, name, socket_id, best_score, total_games) 
       VALUES (?, ?, ?, ?, ?)`,
      [playerId, playerName, socketId, bestScore, totalGames],
      function(err) {
        if (err) {
          reject(err);
        } else {
          if (this.changes === 0) {
            db.run(
              `UPDATE players SET 
               name = ?,
               socket_id = ?,
               best_score = MAX(best_score, ?),
               total_games = total_games + ?,
               last_played = CURRENT_TIMESTAMP
               WHERE player_id = ?`,
              [playerName, socketId, bestScore, totalGames, playerId],
              function(updateErr) {
                if (updateErr) {
                  reject(updateErr);
                } else {
                  resolve(this.lastID);
                }
              }
            );
          } else {
            resolve(this.lastID);
          }
        }
      }
    );
  });
}

function updatePlayerScore(db, playerId, score) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE players 
       SET best_score = MAX(best_score, ?),
           last_played = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [score, playerId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

function incrementPlayerGames(db, playerId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE players SET total_games = total_games + 1 WHERE player_id = ?',
      [playerId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

function saveGameSession(db, playerId, playerName, score) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO game_sessions (player_id, player_name, score) VALUES (?, ?, ?)',
      [playerId, playerName, score],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

function getLeaderboard(db, limit = 50) {
  return new Promise((resolve, reject) => {
    // Agrupar por nome e pegar o melhor score de cada nome
    db.all(
      `SELECT name, MAX(best_score) as score 
       FROM players 
       WHERE best_score > 0
       GROUP BY name
       ORDER BY score DESC 
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

function getAllPlayers(db) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT player_id, name, socket_id, best_score, total_games FROM players ORDER BY last_played DESC',
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

module.exports = {
  initDatabase,
  getPlayer,
  createOrUpdatePlayer,
  updatePlayerScore,
  incrementPlayerGames,
  saveGameSession,
  getLeaderboard,
  getAllPlayers
};
