# 🌐 Guia de Configuração do Portal Cativo Local

Este guia explica como configurar o sistema como um portal cativo local que funciona completamente offline.

## 📋 Pré-requisitos

1. **Roteador TP-Link** (ou qualquer roteador configurável)
2. **Servidor Node.js** conectado via cabo ao roteador
3. **Dispositivos móveis/computadores** para conectar à rede Wi-Fi

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Roteador TP-Link │ (Wi-Fi: EngSoft, Senha: engsoft2025)
│  IP: 192.168.0.1 │
└────────┬─────────┘
         │ (Cabo LAN)
         │
┌────────▼─────────┐
│  Servidor Node.js │ IP: 192.168.0.103 (fixo)
│  - DNS Server     │ Porta 53 (DNS)
│  - HTTP Server    │ Porta 80 (HTTP padrão)
│  - React App      │ Build estático
└───────────────────┘
```

## 🔧 Configuração do Servidor

### 1. Configurar IP Fixo

Configure o servidor para ter um IP fixo na rede local (exemplo: `192.168.0.103`).

**Linux:**
```bash
# Editar /etc/netplan/00-installer-config.yaml (ou similar)
sudo nano /etc/netplan/00-installer-config.yaml
```

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.0.103/24
      gateway4: 192.168.0.1
      nameservers:
        addresses:
          - 192.168.0.103
          - 8.8.8.8
```

```bash
sudo netplan apply
```

**Windows:**
1. Painel de Controle → Rede e Internet → Centro de Rede e Compartilhamento
2. Alterar configurações do adaptador
3. Propriedades do adaptador → TCP/IPv4
4. Configurar IP estático: `192.168.0.103`, Máscara: `255.255.255.0`, Gateway: `192.168.0.1`

**macOS:**
1. Preferências do Sistema → Rede
2. Selecionar a conexão Ethernet
3. Configurar IPv4 manualmente
4. IP: `192.168.0.103`, Máscara: `255.255.255.0`, Roteador: `192.168.0.1`

### 2. Instalar Dependências

```bash
npm run install-all
```

### 3. Build do React

```bash
npm run build
```

Isso criará o build do React em `client/build/`.

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
LOCAL_IP=192.168.0.103
PORT=80
ENABLE_DNS=true
```

**Nota**: A porta 80 requer privilégios de root/administrador. Use `sudo` ao iniciar o servidor.

### 5. Iniciar o Servidor

**Windows:**

1. **Criar arquivo `.env`** na raiz do projeto:
   ```env
   LOCAL_IP=192.168.0.103
   PORT=80
   ENABLE_DNS=true
   NODE_ENV=production
   ```

2. **Iniciar Portal Cativo:**
   - Execute `start-captive.bat` como **Administrador** (clique com botão direito → Executar como administrador)
   - Ou use: `npm run start:captive` (após configurar o `.env`)

3. **Desenvolvimento:**
   - Execute `start-dev.bat`
   - Ou use: `npm run start:dev`

**Linux/macOS:**

1. **Criar arquivo `.env`** na raiz do projeto:
   ```env
   LOCAL_IP=192.168.0.103
   PORT=80
   ENABLE_DNS=true
   NODE_ENV=production
   ```

2. **Iniciar Portal Cativo:**
   ```bash
   sudo npm run start:captive
   ```

3. **Desenvolvimento:**
   ```bash
   npm run start:dev
   # ou
   npm run dev
   ```

## 🔧 Configuração do Roteador

### Método 1: Configurar DNS no Roteador (Recomendado)

1. Acesse o painel do roteador (geralmente `http://192.168.0.1`)
2. Vá em **Configurações de Rede** → **DNS**
3. Configure:
   - **DNS Primário**: `192.168.0.103`
   - **DNS Secundário**: `8.8.8.8` (opcional)
4. Salve e reinicie o roteador

### Método 2: Configurar DNS por Dispositivo

Configure cada dispositivo para usar o servidor como DNS:

**Android:**
1. Configurações → Wi-Fi
2. Segure na rede "EngSoft"
3. Modificar rede → Opções avançadas
4. DNS 1: `192.168.0.103`
5. DNS 2: `8.8.8.8`

**iOS:**
1. Configurações → Wi-Fi
2. Toque no "i" ao lado da rede "EngSoft"
3. Configurar DNS → Manual
4. Adicionar servidor: `192.168.0.103`

**Windows:**
1. Configurações → Rede e Internet → Wi-Fi
2. Propriedades do adaptador → TCP/IPv4
3. Usar os seguintes endereços de servidor DNS: `192.168.0.103`

**macOS:**
1. Preferências do Sistema → Rede
2. Wi-Fi → Avançado → DNS
3. Adicionar: `192.168.0.103`

## 🚀 Como Funciona

1. **Dispositivo conecta ao Wi-Fi** "EngSoft"
2. **Sistema tenta verificar conectividade** (ex: `connectivitycheck.gstatic.com`)
3. **Roteador direciona DNS** para o servidor local (`192.168.0.103`)
4. **Servidor DNS responde** com o IP local para qualquer domínio
5. **Navegador acessa o IP** e é servido pelo Express
6. **React App é exibido** automaticamente

## 🧪 Testando

1. **Conecte-se ao Wi-Fi** "EngSoft"
2. **Abra um navegador** - deve redirecionar automaticamente
3. **Ou acesse manualmente**: `http://192.168.0.103` (sem porta, pois usa porta 80)

## 📝 Notas Importantes

- **Porta 80 (HTTP)**: Requer privilégios de root/administrador. Use `sudo` ao iniciar o servidor.
- **Porta 53 (DNS)**: Requer privilégios de root/administrador. Se não conseguir, use a configuração de DNS no roteador.
- **Build do React**: Sempre execute `npm run build` após fazer alterações no código React.
- **Offline**: Certifique-se de que o React não usa CDNs externos (Google Fonts, etc.). O código já está configurado para isso.
- **Firewall**: Certifique-se de que as portas 53 (DNS) e 80 (HTTP) estão abertas no servidor.
- **Vantagem da Porta 80**: Não é necessário digitar a porta na URL. Os dispositivos acessam automaticamente ao tentar navegar.

## 🔍 Troubleshooting

**Problema**: Dispositivo não redireciona automaticamente
- **Solução**: Configure o DNS manualmente no dispositivo ou no roteador

**Problema**: Erro ao iniciar servidor DNS ou porta 80
- **Solução**: Execute como root/administrador usando `sudo npm run start:captive:sudo`

**Problema**: Página em branco
- **Solução**: Execute `npm run build` para gerar o build do React

**Problema**: Não consegue acessar o servidor
- **Solução**: Verifique se o IP está correto e se o servidor está rodando na interface correta (`0.0.0.0`)

## 🎯 Resumo dos Comandos

**Windows:**

```batch
REM Instalar dependências
npm run install-all

REM Build do React
npm run build

REM Portal Cativo (Execute como Administrador)
start-captive.bat

REM Desenvolvimento
start-dev.bat
```

**Linux/macOS:**

```bash
# Instalar dependências
npm run install-all

# Build do React
npm run build

# Portal Cativo (porta 80 + DNS)
sudo npm run start:captive

# Desenvolvimento (porta 3001)
npm run start:dev
# ou
npm run dev
```

**Nota:** No Windows, crie o arquivo `.env` com as configurações antes de iniciar o servidor. Veja `.env.example` para um exemplo.

