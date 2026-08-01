export const chatTranslations = {
  // Page
  pageTitle: { en: 'Anonymous Chat', pt: 'Chat anônimo' },
  pageDescription: { en: 'Chat anonymously with strangers in real-time. P2P connection means nothing is stored on servers.', pt: 'Converse anonimamente com desconhecidos em tempo real. A conexão P2P significa que nada é armazenado em servidores.' },

  // Connection status
  status: {
    initializing: { en: 'Initializing...', pt: 'Inicializando...' },
    waiting: { en: 'Waiting for peer...', pt: 'Aguardando parceiro...' },
    connecting: { en: 'Connecting...', pt: 'Conectando...' },
    connected: { en: 'Connected', pt: 'Conectado' },
    disconnected: { en: 'Disconnected', pt: 'Desconectado' },
    expired: { en: 'Session Expired', pt: 'Sessão expirada' },
    error: { en: 'Error Occurred', pt: 'Ocorreu um erro' },
  },

  // UI elements
  ui: {
    shareLink: { en: 'Share this link:', pt: 'Compartilhe este link:' },
    copy: { en: 'Copy', pt: 'Copiar' },
    copied: { en: 'Copied!', pt: 'Copiado!' },
    send: { en: 'Send', pt: 'Enviar' },
    inputPlaceholder: { en: 'Type a message...', pt: 'Digite uma mensagem...' },
    remainingTime: { en: 'Time left:', pt: 'Tempo restante:' },
    newChat: { en: 'Start New Chat', pt: 'Iniciar novo chat' },
    myMessage: { en: 'My message', pt: 'Minha mensagem' },
    peerMessage: { en: "Peer's message", pt: 'Mensagem do parceiro' },
    messageInputForm: { en: 'Message input form', pt: 'Formulário de mensagem' },
  },

  // Messages
  messages: {
    peerConnected: { en: 'Peer connected!', pt: 'Parceiro conectado!' },
    peerDisconnected: { en: 'Peer disconnected.', pt: 'Parceiro desconectado.' },
    sessionExpired: { en: 'Session has expired.', pt: 'A sessão expirou.' },
    connectionLost: { en: 'Connection lost.', pt: 'Conexão perdida.' },
    waitingMessage: { en: 'Waiting for peer to join...', pt: 'Aguardando alguém entrar...' },
    connectingMessage: { en: 'Preparing connection...', pt: 'Preparando conexão...' },
    emptyChat: { en: 'Type a message to start chatting!', pt: 'Digite uma mensagem para começar a conversar!' },
  },

  // How to use
  howToUse: {
    title: { en: 'How to Use', pt: 'Como usar' },
    step1: { en: 'Automatically matches with waiting users on page load', pt: 'Combina automaticamente com usuários aguardando ao carregar a página' },
    step2: { en: 'Creates a new room if no one is waiting', pt: 'Cria uma nova sala se ninguém estiver aguardando' },
    step3: { en: 'Share the link to chat with a specific person', pt: 'Compartilhe o link para conversar com uma pessoa específica' },
    step4: { en: 'All messages are P2P and not stored on servers', pt: 'Todas as mensagens são P2P e não são armazenadas em servidores' },
    step5: { en: 'Sessions automatically end after 1 hour', pt: 'As sessões terminam automaticamente após 1 hora' },
  },

  // Description
  description: {
    p2p: { en: 'P2P chat with direct browser-to-browser connection, no server.', pt: 'Chat P2P com conexão direta de navegador para navegador, sem servidor.' },
    privacy: { en: 'Messages are not stored, sessions last up to 1 hour.', pt: 'As mensagens não são armazenadas; as sessões duram até 1 hora.' },
  },

  // Security notes
  security: {
    title: { en: 'Chat with confidence', pt: 'Converse com tranquilidade' },
    noStorage: { en: 'Messages are not stored', pt: 'As mensagens não são armazenadas' },
    p2p: { en: 'Direct P2P connection', pt: 'Conexão P2P direta' },
    sessionLimit: { en: 'Auto-ends after 1 hour', pt: 'Encerra automaticamente após 1 hora' },
  },

  // Quick guide
  quickGuide: {
    share: { en: 'Share link to invite friends', pt: 'Compartilhe o link para convidar amigos' },
    random: { en: 'Or wait for random match', pt: 'Ou aguarde um pareamento aleatório' },
  },
} as const;
