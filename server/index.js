// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const dbModule = require('./database');
const dnsServer = require('./dns-server');
const captivePortal = require('./captive-portal');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do build do React
const buildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(buildPath));

// Nota: O portal cativo será configurado DEPOIS das rotas Socket.IO
// para garantir que o Socket.IO funcione corretamente

let db = null;
let players = {};
let globalLeaderboard = {};
let activeGames = {};

async function initializeDatabase() {
  try {
    db = await dbModule.initDatabase();
    await loadDataFromDatabase();
    console.log('Dados carregados do banco de dados');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
}

async function loadDataFromDatabase() {
  try {
    const dbPlayers = await dbModule.getAllPlayers(db);
    const leaderboardData = await dbModule.getLeaderboard(db);
    
    players = {};
    globalLeaderboard = {};
    
    dbPlayers.forEach(player => {
      players[player.name] = {
        name: player.name,
        bestScore: player.best_score || 0,
        totalGames: player.total_games || 0
      };
      globalLeaderboard[player.name] = player.best_score || 0;
    });
  } catch (error) {
    console.error('Erro ao carregar dados do banco:', error);
  }
}

const TOTAL_CHALLENGES = 9;

const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
const colorNames = ['Vermelho', 'Verde', 'Azul', 'Amarelo', 'Magenta', 'Ciano'];

function generateChallenge(index) {
  const challengeType = Math.floor(Math.random() * 8);
  
  switch(challengeType) {
    case 0:
      return generateColorChallenge();
    case 1:
      return generateMathChallenge();
    case 2:
      return generateReactionChallenge();
    case 3:
      return generateDifferentChallenge();
    case 4:
      return generateDirectionChallenge();
    case 5:
      return generateCountChallenge();
    case 6:
      return generateGreaterLessChallenge();
    case 7:
      return generateOrderChallenge();
    default:
      return generateColorChallenge();
  }
}

function generateColorChallenge() {
  const targetColorIndex = Math.floor(Math.random() * colors.length);
  const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
  
  return {
    type: 'color',
    title: '🎨 Qual é esta cor?',
    targetColor: colors[targetColorIndex],
    targetColorName: colorNames[targetColorIndex],
    options: shuffledColors,
    correctAnswer: shuffledColors.indexOf(colors[targetColorIndex]),
    timeLimit: 15
  };
}

function generateMathChallenge() {
  const num1 = Math.floor(Math.random() * 50) + 1;
  const num2 = Math.floor(Math.random() * 50) + 1;
  const operations = [
    { op: '+', result: num1 + num2 },
    { op: '-', result: num1 - num2 },
    { op: '×', result: num1 * num2 }
  ];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  const options = [];
  const correctIndex = Math.floor(Math.random() * 4);
  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      options.push(operation.result);
    } else {
      options.push(operation.result + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 20) + 5));
    }
  }
  
  return {
    type: 'math',
    title: '🔢 Resolva rapidamente!',
    question: `${num1} ${operation.op === '×' ? '×' : operation.op} ${num2} = ?`,
    options: options,
    correctAnswer: correctIndex,
    timeLimit: 12
  };
}

function generateReactionChallenge() {
  const shapes = ['🔴', '🔵', '🟢', '🟡', '🟣', '⚫', '⚪'];
  const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
  
  return {
    type: 'reaction',
    title: '⚡ Clique quando aparecer!',
    targetShape: targetShape,
    delay: Math.floor(Math.random() * 3000) + 2000,
    correctAnswer: 0,
    timeLimit: 10
  };
}


function generateDifferentChallenge() {
  const shapes = ['🔴', '🔵', '🟢', '🟡'];
  const sameShape = shapes[Math.floor(Math.random() * shapes.length)];
  const differentShape = shapes.find(s => s !== sameShape);
  
  const grid = [
    sameShape, sameShape, sameShape,
    sameShape, differentShape, sameShape,
    sameShape, sameShape, sameShape
  ];
  
  const shuffledGrid = [...grid].sort(() => Math.random() - 0.5);
  const correctIndex = shuffledGrid.indexOf(differentShape);
  
  return {
    type: 'different',
    title: '👁️ Encontre o diferente!',
    grid: shuffledGrid,
    correctAnswer: correctIndex,
    timeLimit: 10
  };
}

function generateDirectionChallenge() {
  const directions = ['⬆️', '⬇️', '⬅️', '➡️'];
  const targetDirection = directions[Math.floor(Math.random() * directions.length)];
  
  const shuffled = [...directions].sort(() => Math.random() - 0.5);
  const correctIndex = shuffled.indexOf(targetDirection);
  
  return {
    type: 'direction',
    title: '🧭 Qual é esta direção?',
    targetDirection: targetDirection,
    options: shuffled,
    correctAnswer: correctIndex,
    timeLimit: 8
  };
}

function generateCountChallenge() {
  const shapes = ['🔴', '🔵', '🟢', '🟡', '⭐', '💎'];
  const count = Math.floor(Math.random() * 9) + 1;
  
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const grid = Array(count).fill(shape);
  
  const options = [];
  const correctIndex = Math.floor(Math.random() * 4);
  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      options.push(count);
    } else {
      let wrongCount = count;
      while (wrongCount === count) {
        wrongCount = Math.floor(Math.random() * 10) + 1;
      }
      options.push(wrongCount);
    }
  }
  
  return {
    type: 'count',
    title: '🔢 Conte rapidamente!',
    grid: grid,
    shape: shape,
    options: options,
    correctAnswer: correctIndex,
    timeLimit: 12
  };
}

function generateGreaterLessChallenge() {
  const num1 = Math.floor(Math.random() * 100) + 1;
  const num2 = Math.floor(Math.random() * 100) + 1;
  const operations = ['>', '<'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let correctAnswer;
  if (operation === '>') {
    correctAnswer = num1 > num2 ? 0 : 1;
  } else {
    correctAnswer = num1 < num2 ? 0 : 1;
  }
  
  return {
    type: 'greaterless',
    title: '⚖️ Qual é maior ou menor?',
    question: `${num1} ${operation} ${num2}?`,
    num1: num1,
    num2: num2,
    operation: operation,
    options: ['Verdadeiro', 'Falso'],
    correctAnswer: correctAnswer,
    timeLimit: 10
  };
}

// function generatePatternChallenge() {
//   const patterns = [
//     { pattern: ['🔴', '🔵', '🔴', '🔵'], next: '🔴' },
//     { pattern: ['⭐', '⭐', '💎'], next: '⭐' },
//     { pattern: ['🟢', '🟡', '🟢', '🟡', '🟢'], next: '🟡' },
//     { pattern: ['🔴', '🔴', '🔵'], next: '🔴' },
//     { pattern: ['💎', '⭐', '💎', '⭐'], next: '💎' },
//     { pattern: ['🔵', '🔵', '🔴'], next: '🔵' }
//   ];
//   
//   const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
//   const allSymbols = [...new Set([...selectedPattern.pattern, selectedPattern.next, '🟢', '🟡', '⭐', '💎'])];
//   
//   const options = [];
//   const correctIndex = Math.floor(Math.random() * 4);
//   for (let i = 0; i < 4; i++) {
//     if (i === correctIndex) {
//       options.push(selectedPattern.next);
//     } else {
//       const wrongOption = allSymbols[Math.floor(Math.random() * allSymbols.length)];
//       options.push(wrongOption);
//     }
//   }
//   
//   return {
//     type: 'pattern',
//     title: '🔍 Complete o padrão!',
//     pattern: selectedPattern.pattern,
//     options: options,
//     correctAnswer: correctIndex,
//     timeLimit: 15
//   };
// }

function generateOrderChallenge() {
  const numbers = [];
  const start = Math.floor(Math.random() * 50) + 1;
  for (let i = 0; i < 4; i++) {
    numbers.push(start + i);
  }
  
  const shuffled = [...numbers].sort(() => Math.random() - 0.5);
  
  const orderTypes = ['maior', 'menor'];
  const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
  
  let correctAnswer;
  if (orderType === 'maior') {
    const max = Math.max(...numbers);
    correctAnswer = shuffled.indexOf(max);
  } else {
    const min = Math.min(...numbers);
    correctAnswer = shuffled.indexOf(min);
  }
  
  return {
    type: 'order',
    title: `📊 Qual é o ${orderType === 'maior' ? 'maior' : 'menor'} número?`,
    numbers: shuffled,
    orderType: orderType,
    options: shuffled.map(n => n.toString()),
    correctAnswer: correctAnswer,
    timeLimit: 12
  };
}

function getGlobalLeaderboard() {
  return Object.entries(globalLeaderboard)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([name, score]) => ({ name, score }));
}

function getActiveGamesInfo() {
  return Object.values(activeGames)
    .filter(game => game.status === 'playing')
    .map(game => ({
      playerName: game.playerName,
      currentScore: game.currentScore,
      challengeNumber: game.challengeIndex + 1
    }))
    .sort((a, b) => b.currentScore - a.currentScore);
}

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on('student-join', async (studentName) => {
    socket.studentName = studentName || `Jogador ${socket.id.slice(0, 6)}`;
    
    try {
      if (db) {
        const dbPlayer = await dbModule.getPlayer(db, socket.studentName);
        if (dbPlayer) {
          players[socket.studentName] = {
            name: socket.studentName,
            bestScore: dbPlayer.best_score || 0,
            totalGames: dbPlayer.total_games || 0
          };
          globalLeaderboard[socket.studentName] = dbPlayer.best_score || 0;
        } else {
          await dbModule.createOrUpdatePlayer(db, socket.studentName, 0, 0);
          players[socket.studentName] = {
            name: socket.studentName,
            bestScore: 0,
            totalGames: 0
          };
          globalLeaderboard[socket.studentName] = 0;
        }
      } else {
        if (!players[socket.studentName]) {
          players[socket.studentName] = {
            name: socket.studentName,
            bestScore: globalLeaderboard[socket.studentName] || 0,
            totalGames: 0
          };
        }
        
        if (!globalLeaderboard[socket.studentName]) {
          globalLeaderboard[socket.studentName] = 0;
        }
      }
      
      socket.emit('welcome', {
        name: socket.studentName,
        bestScore: globalLeaderboard[socket.studentName],
        leaderboard: getGlobalLeaderboard()
      });
      
      io.emit('player-joined', {
        players: Object.values(players),
        leaderboard: getGlobalLeaderboard()
      });
      
      console.log(`Jogador conectado: ${socket.studentName} (${socket.id})`);
    } catch (error) {
      console.error('Erro ao processar join do jogador:', error);
    }
  });

  socket.on('dashboard-join', async ({ password }) => {
    const ADMIN_PASSWORD = 'admin123';
    if (password !== ADMIN_PASSWORD) {
      socket.emit('auth-error', { message: 'Senha incorreta!' });
      return;
    }
    
    try {
      if (db) {
        await loadDataFromDatabase();
      }
    } catch (error) {
      console.error('Erro ao recarregar dados para dashboard:', error);
    }
    
    socket.dashboard = true;
    socket.emit('dashboard-state', {
      players: Object.values(players),
      leaderboard: getGlobalLeaderboard(),
      activeGamesCount: Object.keys(activeGames).length,
      activeGames: getActiveGamesInfo()
    });
    
    console.log(`Dashboard conectado: ${socket.id}`);
  });

  socket.on('start-game', () => {
    if (!socket.studentName) return;
    
    const playerName = socket.studentName;
    
    activeGames[socket.id] = {
      playerName: playerName,
      challengeIndex: 0,
      currentScore: 0,
      status: 'playing',
      currentChallenge: null,
      roundStartTime: null,
      reactionTriggerTime: null,
      timer: null
    };
    
    socket.emit('game-start', {
      totalChallenges: TOTAL_CHALLENGES
    });
    
    startChallengeForPlayer(socket.id);
    
    io.emit('game-status-update', {
      activeGamesCount: Object.keys(activeGames).length,
      leaderboard: getGlobalLeaderboard(),
      activeGames: getActiveGamesInfo()
    });
  });

  socket.on('submit-answer', async (data) => {
    const game = activeGames[socket.id];
    if (!game || game.status !== 'playing' || !game.currentChallenge) return;
    
    const player = players[game.playerName];
    if (!player) return;
    
    const challenge = game.currentChallenge;
    const isCorrect = data.answerIndex === challenge.correctAnswer;
    
    if (game.timer) {
      clearInterval(game.timer);
      game.timer = null;
    }
    
    let pointsEarned = 0;
    if (isCorrect) {
      let timeElapsed;
      if (challenge.type === 'reaction' && game.reactionTriggerTime) {
        timeElapsed = Date.now() - game.reactionTriggerTime;
      } else {
        timeElapsed = Date.now() - game.roundStartTime;
      }
      const maxPoints = 1000;
      pointsEarned = Math.max(100, Math.floor(maxPoints * (1 - timeElapsed / (challenge.timeLimit * 1000))));
      game.currentScore += pointsEarned;
    }
    
    socket.emit('your-answer-result', {
      correct: isCorrect,
      score: game.currentScore,
      pointsEarned: pointsEarned
    });
    
    io.emit('game-status-update', {
      activeGamesCount: Object.keys(activeGames).length,
      leaderboard: getGlobalLeaderboard(),
      activeGames: getActiveGamesInfo()
    });
    
    setTimeout(() => {
      game.challengeIndex++;
      if (game.challengeIndex >= TOTAL_CHALLENGES) {
        endGameForPlayer(socket.id);
      } else {
        startChallengeForPlayer(socket.id);
      }
    }, 2000);
  });

  socket.on('disconnect', () => {
    if (socket.studentName) {
      if (activeGames[socket.id]) {
        delete activeGames[socket.id];
      }
      
      io.emit('player-left', {
        players: Object.values(players),
        leaderboard: getGlobalLeaderboard(),
        activeGamesCount: Object.keys(activeGames).length,
        activeGames: getActiveGamesInfo()
      });
      
      console.log(`Jogador desconectado: ${socket.studentName} (${socket.id})`);
    }
  });
});

function startChallengeForPlayer(socketId) {
  const game = activeGames[socketId];
  if (!game) return;
  
  const challenge = generateChallenge(game.challengeIndex);
  game.currentChallenge = challenge;
  game.roundStartTime = Date.now();
  game.reactionTriggerTime = null;
  
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;
  
  socket.emit('challenge-start', {
    challenge: challenge,
    challengeNumber: game.challengeIndex + 1,
    totalChallenges: TOTAL_CHALLENGES
  });
  
  let timeLeft = challenge.timeLimit;
  
  if (challenge.type === 'reaction') {
    setTimeout(() => {
      game.reactionTriggerTime = Date.now();
      socket.emit('reaction-trigger', {
        targetShape: challenge.targetShape
      });
    }, challenge.delay);
  }
  
  game.timer = setInterval(() => {
    timeLeft--;
    socket.emit('timer-update', timeLeft);
    
    if (timeLeft <= 0) {
      if (game.timer) {
        clearInterval(game.timer);
        game.timer = null;
      }
      
      game.challengeIndex++;
      if (game.challengeIndex >= TOTAL_CHALLENGES) {
        endGameForPlayer(socketId);
      } else {
        setTimeout(() => {
          startChallengeForPlayer(socketId);
        }, 1000);
      }
    }
  }, 1000);
}

async function endGameForPlayer(socketId) {
  const game = activeGames[socketId];
  if (!game) return;
  
  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }
  
  game.status = 'finished';
  
  const playerName = game.playerName;
  const finalScore = game.currentScore;
  const previousBest = globalLeaderboard[playerName] || 0;
  const isNewRecord = finalScore > previousBest;
  
  if (finalScore > previousBest) {
    globalLeaderboard[playerName] = finalScore;
  }
  
  const player = players[playerName];
  if (player) {
    player.bestScore = globalLeaderboard[playerName];
    player.totalGames++;
  }
  
  try {
    if (db) {
      await dbModule.saveGameSession(db, playerName, finalScore);
      
      if (isNewRecord) {
        await dbModule.updatePlayerScore(db, playerName, finalScore);
      }
      
      await dbModule.incrementPlayerGames(db, playerName);
      
      const updatedPlayer = await dbModule.getPlayer(db, playerName);
      if (updatedPlayer) {
        player.bestScore = updatedPlayer.best_score || 0;
        player.totalGames = updatedPlayer.total_games || 0;
        globalLeaderboard[playerName] = updatedPlayer.best_score || 0;
      }
    }
  } catch (error) {
    console.error('Erro ao salvar dados do jogo:', error);
  }
  
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit('game-end', {
      finalScore: finalScore,
      bestScore: globalLeaderboard[playerName],
      leaderboard: getGlobalLeaderboard(),
      isNewRecord: isNewRecord
    });
  }
  
  delete activeGames[socketId];
  
  io.emit('game-status-update', {
    activeGamesCount: Object.keys(activeGames).length,
    leaderboard: getGlobalLeaderboard(),
    activeGames: getActiveGamesInfo()
  });
}

setInterval(() => {
  io.emit('leaderboard-update', {
    leaderboard: getGlobalLeaderboard(),
    activeGamesCount: Object.keys(activeGames).length,
    activeGames: getActiveGamesInfo()
  });
}, 2000);

// Configurar portal cativo DEPOIS de configurar todas as rotas Socket.IO
// Isso garante que o Socket.IO funcione antes do catch-all do portal cativo
captivePortal.setupCaptivePortal(app, buildPath);

// Porta padrão: 80 para portal cativo, 3001 para desenvolvimento
// Lê do arquivo .env ou usa valores padrão
const DEFAULT_PORT = process.env.NODE_ENV === 'production' || process.env.ENABLE_DNS === 'true' ? 80 : 3001;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;
const ENABLE_DNS = process.env.ENABLE_DNS === 'true' || process.env.ENABLE_DNS === true;

// Iniciar servidor DNS se habilitado
if (ENABLE_DNS) {
  const dnsStarted = dnsServer.startDNSServer();
  if (!dnsStarted) {
    console.log('[INFO] Servidor DNS não iniciado. Configure o roteador para usar este servidor como DNS.');
  }
}

function startServer() {
  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
      if (err.code === 'EACCES') {
        console.error(`\n❌ Erro: Permissão negada para porta ${PORT}`);
        console.error(`   Porta ${PORT} requer privilégios de root/administrador.`);
        console.error(`   Execute com sudo: sudo npm run start:captive:sudo`);
        process.exit(1);
      } else if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: Porta ${PORT} já está em uso.`);
        console.error(`   Feche o processo que está usando a porta ou use outra porta.`);
        process.exit(1);
      } else {
        console.error(`\n❌ Erro ao iniciar servidor:`, err);
        process.exit(1);
      }
      return;
    }
    const protocol = PORT === 443 ? 'https' : 'http';
    const portDisplay = PORT === 80 || PORT === 443 ? '' : `:${PORT}`;
    
    console.log(`\n🚀 Servidor HTTP rodando na porta ${PORT}`);
    console.log(`📱 Acesse ${protocol}://localhost${portDisplay} ou ${protocol}://${dnsServer.LOCAL_IP}${portDisplay}`);
    console.log(`\n🌐 Portal Cativo Configurado:`);
    console.log(`   - IP Local: ${dnsServer.LOCAL_IP}`);
    console.log(`   - Porta HTTP: ${PORT}${PORT === 80 ? ' (padrão - não precisa digitar na URL)' : ''}`);
    if (ENABLE_DNS) {
      console.log(`   - Servidor DNS: Ativo (porta 53)`);
    } else {
      console.log(`   - Servidor DNS: Desabilitado (configure o roteador manualmente)`);
    }
    console.log(`\n📋 Configuração do Roteador:`);
    console.log(`   1. Configure o DNS do roteador para: ${dnsServer.LOCAL_IP}`);
    console.log(`   2. Ou configure cada dispositivo para usar: ${dnsServer.LOCAL_IP} como DNS`);
    console.log(`\n💡 URL de Acesso:`);
    console.log(`   - Portal Cativo: http://${dnsServer.LOCAL_IP}${portDisplay}`);
    console.log(`   - Ou simplesmente: http://${dnsServer.LOCAL_IP}${PORT === 80 ? '' : ':' + PORT}`);
    console.log(`\n`);
  });
}

initializeDatabase().then(() => {
  startServer();
}).catch((error) => {
  console.error('Erro ao inicializar servidor:', error);
  startServer();
});