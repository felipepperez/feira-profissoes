import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
const colorNames = ['Vermelho', 'Verde', 'Azul', 'Amarelo', 'Magenta', 'Ciano'];

const GameInterface = () => {
  const [socket, setSocket] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const NAME_KEY = 'player_name';
  const [gameState, setGameState] = useState({
    status: 'waiting',
    currentChallenge: null
  });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [reactionTriggered, setReactionTriggered] = useState(false);
  const [challengeNumber, setChallengeNumber] = useState(0);

  useEffect(() => {
    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) {
      setStudentName(savedName);
      setNameSubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (nameSubmitted && studentName) {
      localStorage.setItem(NAME_KEY, studentName);
      
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

      newSocket.emit('student-join', studentName);

      newSocket.on('welcome', ({ name, bestScore, leaderboard }) => {
        setBestScore(bestScore || 0);
        setScore(0);
        setLeaderboard(leaderboard || []);
        setGameState(prev => ({ ...prev, status: 'waiting' }));
      });

      newSocket.on('leaderboard-update', ({ leaderboard }) => {
        setLeaderboard(leaderboard || []);
      });

      newSocket.on('game-start', ({ totalChallenges }) => {
        // Limpar todos os estados relacionados aos botões e respostas
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setAnswerResult(null);
        setScore(0);
        setTimeLeft(0);
        setReactionTriggered(false);
        setGameState(prev => ({ 
          ...prev, 
          status: 'playing',
          currentChallenge: null
        }));
      });

      newSocket.on('challenge-start', ({ challenge, challengeNumber, totalChallenges }) => {
        // Limpar todos os estados relacionados aos botões e respostas antes de iniciar novo desafio
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setAnswerResult(null);
        setTimeLeft(challenge.timeLimit);
        setReactionTriggered(false);
        setChallengeNumber(challengeNumber);
        setGameState(prev => ({
          ...prev,
          status: 'playing',
          currentChallenge: challenge
        }));
      });

      newSocket.on('timer-update', (time) => {
        setTimeLeft(time);
      });

      newSocket.on('reaction-trigger', ({ targetShape }) => {
        setReactionTriggered(true);
        setGameState(prev => ({
          ...prev,
          currentChallenge: {
            ...prev.currentChallenge,
            reactionShape: targetShape
          }
        }));
      });

      newSocket.on('your-answer-result', ({ correct, score, pointsEarned }) => {
        setAnswerResult({ correct, pointsEarned });
        setScore(score);
      });

      newSocket.on('challenge-end', ({ challengeNumber }) => {
        setGameState(prev => ({
          ...prev,
          status: 'waiting'
        }));
        setAnswerResult(null);
      });

      newSocket.on('game-end', ({ finalScore, bestScore, leaderboard, isNewRecord }) => {
        setBestScore(bestScore);
        setScore(finalScore);
        setLeaderboard(leaderboard || []);
        setGameState(prev => ({
          ...prev,
          status: 'finished',
          isNewRecord: isNewRecord
        }));
      });

      return () => {
        newSocket.close();
      };
    }
  }, [nameSubmitted, studentName]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (studentName.trim()) {
      setNameSubmitted(true);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (!answerSubmitted && gameState.status === 'playing' && socket) {
      setSelectedAnswer(answerIndex);
      socket.emit('submit-answer', { answerIndex: answerIndex });
      setAnswerSubmitted(true);
    }
  };

  const handleReactionClick = () => {
    if (gameState.currentChallenge?.type === 'reaction' && reactionTriggered && !answerSubmitted && socket) {
      socket.emit('submit-answer', { answerIndex: 0 });
      setAnswerSubmitted(true);
      setAnswerResult({ correct: true });
    }
  };

  const handleStartGame = () => {
    if (socket && gameState.status !== 'playing') {
      socket.emit('start-game');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(NAME_KEY);
    setStudentName('');
    setNameSubmitted(false);
    setScore(0);
    setBestScore(0);
    setLeaderboard([]);
    setGameState({
      status: 'waiting',
      currentChallenge: null
    });
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setAnswerResult(null);
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  const renderChallenge = () => {
    const challenge = gameState.currentChallenge;
    if (!challenge) return null;

    switch (challenge.type) {
      case 'color':
        return (
          <div className="challenge-container">
            <div 
              className="color-display"
              style={{ 
                backgroundColor: challenge.targetColor,
                width: '200px',
                height: '200px',
                margin: '2rem auto',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}
            ></div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
              Qual é esta cor?
            </h3>
            <div className="question-options">
              {challenge.options.map((color, index) => (
                <button
                  key={index}
                  className={`question-option ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    answerResult
                      ? index === challenge.correctAnswer
                        ? 'correct'
                        : selectedAnswer === index && !answerResult.correct
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                  style={{
                    backgroundColor: color,
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    border: selectedAnswer === index ? '4px solid white' : 'none'
                  }}
                >
                  {colorNames[colors.indexOf(color)]}
                </button>
              ))}
            </div>
          </div>
        );

      case 'math':
        return (
          <div className="challenge-container">
            <h2 style={{ fontSize: '3rem', margin: '2rem 0', color: '#667eea' }}>
              {challenge.question}
            </h2>
            <div className="question-options">
              {challenge.options.map((option, index) => (
                <button
                  key={index}
                  className={`question-option ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    answerResult
                      ? index === challenge.correctAnswer
                        ? 'correct'
                        : selectedAnswer === index && !answerResult.correct
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'reaction':
        return (
          <div className="challenge-container">
            <h2 style={{ margin: '2rem 0' }}>
              {!reactionTriggered ? 'Aguarde...' : 'Clique agora!'}
            </h2>
            {reactionTriggered && (
              <div 
                className="reaction-shape"
                onClick={handleReactionClick}
                style={{
                  fontSize: '10rem',
                  cursor: answerSubmitted ? 'default' : 'pointer',
                  transition: 'transform 0.2s',
                  opacity: answerSubmitted ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!answerSubmitted) e.target.style.transform = 'scale(1.2)';
                }}
                onMouseLeave={(e) => {
                  if (!answerSubmitted) e.target.style.transform = 'scale(1)';
                }}
              >
                {gameState.currentChallenge?.reactionShape || challenge.targetShape}
              </div>
            )}
            {!reactionTriggered && (
              <div style={{ fontSize: '3rem', marginTop: '2rem' }}>👀</div>
            )}
          </div>
        );


      case 'different':
        return (
          <div className="challenge-container">
            <h3 style={{ marginBottom: '1rem' }}>Encontre o diferente!</h3>
            <div className="grid-display">
              {challenge.grid.map((item, index) => (
                <button
                  key={index}
                  className={`grid-item ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    answerResult
                      ? index === challenge.correctAnswer
                        ? 'correct'
                        : selectedAnswer === index && !answerResult.correct
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                  style={{
                    fontSize: '2.5rem',
                    width: '100px',
                    height: '100px',
                    border: '3px solid #ccc',
                    borderRadius: '10px',
                    cursor: answerSubmitted ? 'default' : 'pointer'
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );

      case 'direction':
        return (
          <div className="challenge-container">
            <div className="direction-display">
              {challenge.targetDirection}
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
              Qual é esta direção?
            </h3>
            <div className="question-options">
              {challenge.options.map((direction, index) => (
                <button
                  key={index}
                  className={`question-option ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    answerResult
                      ? index === challenge.correctAnswer
                        ? 'correct'
                        : selectedAnswer === index && !answerResult.correct
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                  style={{ fontSize: '2rem' }}
                >
                  {direction}
                </button>
              ))}
            </div>
          </div>
        );

      case 'count':
        return (
          <div className="challenge-container">
            <h3 style={{ marginBottom: '1rem' }}>Conte rapidamente!</h3>
            <div className="sequence-display">
              {challenge.grid.map((item, index) => (
                <span key={index} style={{ fontSize: '2.5rem', margin: '0 0.3rem' }}>
                  {item}
                </span>
              ))}
            </div>
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              Quantos {challenge.shape} você vê?
            </h3>
            <div className="question-options">
              {challenge.options.map((option, index) => (
                <button
                  key={index}
                  className={`question-option ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    answerResult
                      ? index === challenge.correctAnswer
                        ? 'correct'
                        : selectedAnswer === index && !answerResult.correct
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                  style={{ fontSize: '1.5rem' }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'greaterless':
        return (
          <div className="challenge-container">
            <h2 style={{ fontSize: '3rem', margin: '2rem 0', color: '#667eea' }}>
              {challenge.question}
            </h2>
            <div className="question-options">
              {challenge.options.map((option, index) => (
                <button
                  key={index}
                  className={`question-option ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    answerResult
                      ? index === challenge.correctAnswer
                        ? 'correct'
                        : selectedAnswer === index && !answerResult.correct
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      // case 'pattern':
      //   return (
      //     <div className="challenge-container">
      //       <h3 style={{ marginBottom: '1rem' }}>Complete o padrão!</h3>
      //       <div className="sequence-display">
      //         {challenge.pattern.map((item, index) => (
      //           <span key={index} style={{ fontSize: '3rem', margin: '0 0.5rem' }}>
      //             {item}
      //           </span>
      //         ))}
      //         <span style={{ fontSize: '3rem', margin: '0 0.5rem', color: '#667eea' }}>?</span>
      //       </div>
      //       <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>
      //         Qual símbolo completa o padrão?
      //       </h3>
      //       <div className="question-options">
      //         {challenge.options.map((option, index) => (
      //           <button
      //             key={index}
      //             className={`question-option ${
      //               selectedAnswer === index ? 'selected' : ''
      //             } ${
      //               answerResult
      //                 ? index === challenge.correctAnswer
      //                   ? 'correct'
      //                   : selectedAnswer === index && !answerResult.correct
      //                   ? 'incorrect'
      //                   : ''
      //                 : ''
      //             }`}
      //             onClick={() => handleAnswerSelect(index)}
      //             disabled={answerSubmitted}
      //             style={{ fontSize: '2rem' }}
      //           >
      //             {option}
      //           </button>
      //         ))}
      //       </div>
      //     </div>
      //   );

      case 'order':
        return (
          <div className="challenge-container">
            <h3 style={{ marginBottom: '1rem' }}>Qual é o {challenge.orderType === 'maior' ? 'maior' : 'menor'} número?</h3>
            <div className="sequence-display order-numbers">
              {challenge.numbers.map((num, index) => (
                <span key={index} className="order-number-item">
                  {num}
                </span>
              ))}
            </div>
            <div className="question-options" style={{ marginTop: '2rem' }}>
              {challenge.options.map((option, index) => (
                <button
                  key={index}
                  className={`question-option ${
                    selectedAnswer === index ? 'selected' : ''
                  } ${
                    answerResult
                      ? index === challenge.correctAnswer
                        ? 'correct'
                        : selectedAnswer === index && !answerResult.correct
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                  style={{ fontSize: '1.5rem' }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="student-interface">
      <div className="student-header">
        <h1>🎮 Desafio de Velocidade</h1>
        {nameSubmitted && (
          <div className="student-header-actions">
            <span className="student-name-display">
              {studentName}
            </span>
            <button 
              onClick={handleLogout} 
              className="back-btn logout-btn-mobile"
            >
              Sair/Trocar Nome
            </button>
          </div>
        )}
      </div>

      {!nameSubmitted ? (
        <div className="name-input">
          <form onSubmit={handleNameSubmit}>
            <label>
              <h2>Digite seu nome:</h2>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Seu nome aqui"
                required
                autoFocus
              />
            </label>
            <button type="submit">Entrar no Jogo</button>
          </form>
        </div>
      ) : gameState.status === 'waiting' ? (
        <div className="waiting-screen">
          <h2>👋 Olá, {studentName}!</h2>
          {bestScore > 0 && (
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              🏆 Sua Melhor Pontuação: {bestScore} pontos
            </p>
          )}
          <p style={{ fontSize: '1rem', marginBottom: '2rem' }}>
            Clique no botão abaixo para começar um novo jogo!
          </p>
          <button
            onClick={handleStartGame}
            className="submit-btn"
            style={{ maxWidth: '300px', margin: '0 auto' }}
          >
            🎮 Iniciar Novo Jogo
          </button>
          {leaderboard && leaderboard.length > 0 && (
            <div className="leaderboard" style={{ marginTop: '2rem', maxWidth: '500px', margin: '2rem auto' }}>
              <h3>🏆 Ranking Geral</h3>
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div key={index} className="leaderboard-item">
                  <span>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {' '}
                    {index + 1}. {entry.name}
                    {entry.name === studentName && ' (Você)'}
                  </span>
                  <span>{entry.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : gameState.status === 'finished' ? (
        <div className="waiting-screen">
          <h2>🏁 Jogo Finalizado!</h2>
          <div className="score-display">
            <div className="current-score">
              Pontuação desta rodada: {score} pontos
            </div>
            {bestScore > 0 && (
              <div className="current-score" style={{ marginTop: '1rem', fontSize: '1.3rem' }}>
                🏆 Sua Melhor Pontuação: {bestScore} pontos
              </div>
            )}
            {gameState.isNewRecord && bestScore === score && (
              <div style={{ 
                fontSize: '1.5rem', 
                color: '#4caf50', 
                fontWeight: 'bold',
                marginTop: '1rem'
              }}>
                🎉 Novo Recorde Pessoal!
              </div>
            )}
          </div>
          <button
            onClick={handleStartGame}
            className="submit-btn"
            style={{ maxWidth: '300px', margin: '2rem auto' }}
          >
            🎮 Jogar Novamente
          </button>
          {leaderboard && leaderboard.length > 0 && (
            <div className="leaderboard" style={{ marginTop: '2rem', maxWidth: '500px', margin: '2rem auto' }}>
              <h3>🏆 Ranking Geral</h3>
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div key={index} className="leaderboard-item">
                  <span>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {' '}
                    {index + 1}. {entry.name}
                    {entry.name === studentName && ' (Você)'}
                  </span>
                  <span>{entry.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : gameState.status === 'playing' && gameState.currentChallenge ? (
        <div className="question-screen">
          <div className="challenge-header-mobile">
            <h2 style={{ margin: 0 }}>Desafio {challengeNumber} / 10</h2>
            <div className="current-score" style={{ fontSize: '1.2rem' }}>
              Pontos: {score}
            </div>
          </div>

          {timeLeft > 0 && (
            <div className="timer-display">⏱️ {timeLeft}s</div>
          )}

          {renderChallenge()}


          {answerResult && (
            <div className="result-screen">
              <div className="correct-indicator">
                {answerResult.correct ? '✅' : '❌'}
              </div>
              <h2>
                {answerResult.correct
                  ? `Resposta Correta! +${answerResult.pointsEarned || 0} pontos`
                  : 'Resposta Incorreta'}
              </h2>
            </div>
          )}

          <div className="score-display">
            <div className="current-score">Pontuação: {score}</div>
          </div>
        </div>
      ) : (
        <div className="waiting-screen">
          <h2>Aguardando próximo desafio...</h2>
          <div className="score-display">
            <div className="current-score">Pontuação: {score}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInterface;
