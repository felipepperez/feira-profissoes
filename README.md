# Desafio de Velocidade - Jogo Interativo com WebSockets

Sistema de jogo interativo em tempo real desenvolvido para apresentação de TI em faculdade de engenharia de software. Utiliza WebSockets (Socket.IO) para comunicação bidirecional entre jogadores e dashboard de ranking.

## 🎮 Funcionalidades

- **Jogo Automático**: Inicia automaticamente quando o primeiro jogador entra
- **5 Tipos de Desafios Interativos**:
  - 🎨 **Desafio de Cor**: Identificar cores rapidamente
  - 🔢 **Matemática Rápida**: Resolver cálculos simples
  - ⚡ **Reação Rápida**: Clicar quando aparecer o sinal
  - 🧠 **Sequência de Memória**: Lembrar sequências
  - 👁️ **Encontrar o Diferente**: Identificar o item diferente em uma grade
  
- **Dashboard de Ranking**: Visualização em tempo real dos resultados
- **Pontuação em Tempo Real**: Sistema de pontos baseado em velocidade de resposta
- **Ranking**: Leaderboard atualizado em tempo real
- **Jogadores Conectados**: Lista de jogadores ativos no jogo

## 🚀 Tecnologias

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: React
- **Comunicação**: WebSockets (Socket.IO)

## 📦 Instalação

1. Instale as dependências do projeto:

```bash
npm run install-all
```

Ou instale manualmente:

```bash
npm install
cd client
npm install
```

## ▶️ Como Executar

Execute tanto o servidor quanto o cliente simultaneamente:

```bash
npm run dev
```

Ou execute separadamente:

**Terminal 1 - Servidor:**
```bash
npm run server
```

**Terminal 2 - Cliente:**
```bash
npm run client
```

O servidor estará rodando em `http://localhost:3001`
O cliente React estará rodando em `http://localhost:3000`

## 🎓 Como Usar

### Para Jogar:

1. Acesse `http://localhost:3000`
2. Clique em "Jogar"
3. Digite seu nome
4. O jogo começará automaticamente após 5 segundos (ou quando houver pelo menos 1 jogador)
5. Responda aos desafios o mais rápido possível (mais rápido = mais pontos!)
6. O jogo termina após 10 desafios
7. Veja sua posição no ranking final

### Para o Dashboard:

1. Acesse `http://localhost:3000`
2. Clique em "Dashboard"
3. Visualize:
   - Jogadores conectados
   - Status do jogo
   - Desafio atual
   - Ranking em tempo real
   - Pontuação de cada jogador

## 🎯 Sistema de Pontuação

- Resposta correta: **100 a 1000 pontos**
- Pontos calculados pela velocidade: quanto mais rápido, mais pontos
- Fórmula: `max(100, 1000 * (1 - tempo_decorrido / tempo_limite))`

## 📋 Estrutura do Projeto

```
feira-profissoes/
├── server/
│   └── index.js          # Servidor Node.js com Socket.IO
├── client/
│   ├── src/
│   │   ├── App.js        # Componente principal
│   │   ├── components/
│   │   │   ├── Dashboard.js       # Dashboard de ranking
│   │   │   └── GameInterface.js   # Interface do jogo
│   │   └── ...
│   └── package.json
├── package.json
└── README.md
```

## 🔧 Personalização

Você pode modificar o jogo editando `server/index.js`:
- Número de desafios: altere `TOTAL_CHALLENGES`
- Tempo de espera para início: altere `AUTO_START_DELAY`
- Tempo limite por desafio: altere `timeLimit` em cada função `generate*Challenge()`
- Tipos de desafios: modifique ou adicione novos tipos na função `generateChallenge()`

## 📝 Notas

- O sistema suporta múltiplos jogadores conectados simultaneamente
- A pontuação é calculada baseada na velocidade da resposta (mais rápido = mais pontos)
- Todas as conexões são gerenciadas via WebSockets para comunicação em tempo real
- O sistema funciona em tempo real, sem necessidade de recarregar a página
- O jogo inicia automaticamente quando há pelo menos 1 jogador conectado

## 🎯 Casos de Uso

- Apresentações de TI em salas de aula
- Demonstração de tecnologias WebSocket
- Jogos interativos para eventos
- Gamificação de aprendizado
- Competições de velocidade e reação