/**
 * Servidor de Portal Cativo Local
 * 
 * Este módulo configura o servidor para funcionar como portal cativo:
 * - Captura requisições de verificação de conectividade
 * - Redireciona todos os acessos para a aplicação React
 * - Funciona offline, sem necessidade de internet
 */

const express = require('express');
const path = require('path');

// Domínios comuns usados para verificação de portal cativo
const CAPTIVE_PORTAL_DOMAINS = [
  'connectivitycheck.gstatic.com',
  'captive.apple.com',
  'www.msftconnecttest.com',
  'www.msftncsi.com',
  'connectivitycheck.android.com',
  'clients3.google.com',
  'detectportal.firefox.com',
  'connectivitycheck.platform.hicloud.com',
  'gstatic.com',
  'apple.com',
  'msftconnecttest.com',
  'msftncsi.com',
  'android.com',
  'google.com',
  'firefox.com',
  'hicloud.com'
];

/**
 * Configura middleware para capturar verificações de portal cativo
 * IMPORTANTE: Esta função deve ser chamada DEPOIS de configurar Socket.IO e APIs
 */
function setupCaptivePortal(app, buildPath) {
  // Middleware para capturar requisições de portal cativo
  // Deve vir antes do catch-all, mas depois das rotas de API
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    const userAgent = req.get('user-agent') || '';
    
    // Verificar se é uma requisição de verificação de portal cativo
    const isCaptiveCheck = CAPTIVE_PORTAL_DOMAINS.some(domain => {
      return host.includes(domain) || 
             req.path.includes(domain) ||
             req.originalUrl.includes(domain);
    });
    
    // Verificar se é uma requisição de verificação de conectividade
    const isConnectivityCheck = 
      req.path.includes('/generate_204') ||
      req.path.includes('/connectivitycheck') ||
      req.path.includes('/ncsi.txt') ||
      req.path.includes('/success.txt') ||
      req.path.includes('/hotspot-detect.html');
    
    // Log para debug
    if (isCaptiveCheck || isConnectivityCheck) {
      console.log(`[Captive Portal] Capturando: ${req.method} ${req.originalUrl} (Host: ${host})`);
    }
    
    // Se for verificação de portal cativo, retornar sucesso (200) com HTML
    if (isConnectivityCheck) {
      // Para verificações específicas, retornar respostas adequadas
      if (req.path.includes('/ncsi.txt')) {
        return res.status(200).send('Microsoft NCSI');
      }
      if (req.path.includes('/success.txt')) {
        return res.status(200).send('success');
      }
      if (req.path.includes('/generate_204')) {
        // Android usa 204 No Content, mas vamos redirecionar
        return res.status(200).sendFile(path.join(buildPath, 'index.html'));
      }
      if (req.path.includes('/hotspot-detect.html')) {
        // iOS verificação
        return res.status(200).sendFile(path.join(buildPath, 'index.html'));
      }
      // Outras verificações
      return res.status(200).sendFile(path.join(buildPath, 'index.html'));
    }
    
    // Se for domínio de portal cativo, servir o React
    if (isCaptiveCheck) {
      return res.status(200).sendFile(path.join(buildPath, 'index.html'));
    }
    
    next();
  });
  
  // Rota catch-all para servir o React (deve vir depois das rotas de API)
  // IMPORTANTE: Esta rota deve ser a última, após todas as outras rotas
  app.get('*', (req, res) => {
    // Ignorar requisições do Socket.IO e API (essas devem ser tratadas antes)
    if (req.path.startsWith('/socket.io')) {
      return res.status(404).send('Socket.IO not found');
    }
    
    // Servir o React para todas as outras rotas
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
      if (err) {
        console.error('[Captive Portal] Erro ao servir index.html:', err);
        res.status(500).send('Erro ao carregar aplicação');
      }
    });
  });
}

module.exports = {
  setupCaptivePortal,
  CAPTIVE_PORTAL_DOMAINS
};

