const dns2 = require('dns2');

const { Packet } = dns2;

const PORT = 53;
// Lê LOCAL_IP do arquivo .env ou usa valor padrão
const LOCAL_IP = process.env.LOCAL_IP || '192.168.0.103';

const server = dns2.createServer({
  udp: true,
  tcp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    
    // Responde a todas as requisições DNS com o IP local
    request.questions.forEach((question) => {
      const { name } = question;
      console.log(`[DNS] Resolvendo ${name} para ${LOCAL_IP}`);
      
      response.answers.push({
        name,
        type: Packet.TYPE.A,
        class: Packet.CLASS.IN,
        ttl: 300,
        address: LOCAL_IP
      });
    });
    
    send(response);
  }
});

server.on('request', (request, response, rinfo) => {
  console.log(`[DNS] Requisição de ${rinfo.address}:${rinfo.port}`);
});

server.on('requestError', (error) => {
  console.error('[DNS] Erro na requisição:', error);
});

server.on('listening', () => {
  console.log(`[DNS] Servidor DNS rodando na porta ${PORT}`);
  console.log(`[DNS] Redirecionando todos os domínios para ${LOCAL_IP}`);
  console.log('[DNS] Nota: Este servidor precisa rodar como root/administrador para usar a porta 53');
});

server.on('close', () => {
  console.log('[DNS] Servidor DNS fechado');
});

function startDNSServer() {
  try {
    server.listen({
      udp: { port: PORT, address: '0.0.0.0', type: 'udp4' },
      tcp: { port: PORT, address: '0.0.0.0' }
    });
    return true;
  } catch (error) {
    console.error('[DNS] Erro ao iniciar servidor DNS:', error.message);
    console.error('[DNS] Nota: Para usar a porta 53, execute o servidor como root/administrador');
    console.error('[DNS] Alternativa: Configure o roteador para usar este servidor como DNS');
    return false;
  }
}

function stopDNSServer() {
  server.close();
}

module.exports = {
  startDNSServer,
  stopDNSServer,
  LOCAL_IP
};

