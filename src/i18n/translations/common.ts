// Common UI translations
import type { Language } from '../index';

export const commonTranslations = {
  // Navigation
  nav: {
    home: { en: 'Home', pt: 'Início' },
    blog: { en: 'Blog', pt: 'Blog' },
    articles: { en: 'Articles', pt: 'Artigos' },
    jobs: { en: 'Jobs', pt: 'Vagas' },
    projects: { en: 'Projects', pt: 'Projetos' },
    tools: { en: 'Tools', pt: 'Ferramentas' },
    games: { en: 'Games', pt: 'Jogos' },
  },

  // Footer
  footer: {
    copyright: { en: '© 2024 lacorte.dev. All rights reserved.', pt: '© 2024 lacorte.dev. Todos os direitos reservados.' },
    builtWith: { en: 'Built with', pt: 'Feito com' },
  },

  // Common UI
  ui: {
    loading: { en: 'Loading...', pt: 'Carregando...' },
    error: { en: 'An error occurred', pt: 'Ocorreu um erro' },
    retry: { en: 'Retry', pt: 'Tentar novamente' },
    close: { en: 'Close', pt: 'Fechar' },
    back: { en: 'Back', pt: 'Voltar' },
    next: { en: 'Next', pt: 'Próximo' },
    prev: { en: 'Previous', pt: 'Anterior' },
    save: { en: 'Save', pt: 'Salvar' },
    cancel: { en: 'Cancel', pt: 'Cancelar' },
    confirm: { en: 'Confirm', pt: 'Confirmar' },
    delete: { en: 'Delete', pt: 'Excluir' },
    edit: { en: 'Edit', pt: 'Editar' },
    search: { en: 'Search', pt: 'Buscar' },
    share: { en: 'Share', pt: 'Compartilhar' },
    language: { en: 'Language', pt: 'Idioma' },
    darkMode: { en: 'Dark Mode', pt: 'Modo escuro' },
    lightMode: { en: 'Light Mode', pt: 'Modo claro' },
  },

  // Home page
  home: {
    welcome: { en: 'Welcome', pt: 'Bem-vindo' },
    subtitle: { en: 'Developer Blog & Projects', pt: 'Blog e projetos de desenvolvimento' },
    latestPosts: { en: 'Latest Posts', pt: 'Posts recentes' },
    viewAll: { en: 'View All', pt: 'Ver todos' },
    featuredProjects: { en: 'Featured Projects', pt: 'Projetos em destaque' },
    tryTools: { en: 'Try Our Tools', pt: 'Experimente nossas ferramentas' },
    playGames: { en: 'Play Games', pt: 'Jogar' },
  },

  // Projects page
  projects: {
    title: { en: 'Projects', pt: 'Projetos' },
    description: { en: 'Various projects and experiments', pt: 'Diversos projetos e experimentos' },
    viewProject: { en: 'View Project', pt: 'Ver projeto' },
    allProjects: { en: 'All Projects', pt: 'Todos os projetos' },
    newProject: { en: 'New Project', pt: 'Novo projeto' },
    comingSoon: { en: 'Coming Soon...', pt: 'Em breve...' },
    // Project items
    gameCenter: { en: 'Game Center', pt: 'Central de jogos' },
    gameCenterDesc: { en: 'Fun mini game collection', pt: 'Coleção de minijogos divertidos' },
    roulette: { en: 'Roulette', pt: 'Roleta' },
    rouletteDesc: { en: 'Random roulette game with custom items', pt: 'Roleta aleatória com itens personalizados' },
    slotMachine: { en: 'Slot Machine', pt: 'Caça-níquel' },
    slotMachineDesc: { en: 'Try your luck for 777!', pt: 'Teste sua sorte com o 777!' },
    rockPaperScissors: { en: 'Rock Paper Scissors', pt: 'Pedra, papel e tesoura' },
    rockPaperScissorsDesc: { en: 'Rock paper scissors against AI', pt: 'Pedra, papel e tesoura contra a IA' },
    numberGuess: { en: 'Number Guess', pt: 'Adivinhe o número' },
    numberGuessDesc: { en: 'Up & Down number guessing game', pt: 'Jogo de adivinhar o número (maior ou menor)' },
    memoryGame: { en: 'Memory Game', pt: 'Jogo da memória' },
    memoryGameDesc: { en: 'Card matching brain game', pt: 'Jogo mental de combinar cartas' },
    reactionTest: { en: 'Reaction Test', pt: 'Teste de reação' },
    reactionTestDesc: { en: 'Measure your reaction speed', pt: 'Meça a velocidade da sua reação' },
    gallery: { en: 'Gallery', pt: 'Galeria' },
    galleryDesc: { en: 'Photo Gallery', pt: 'Galeria de fotos' },
  },

  // Blog
  blog: {
    title: { en: 'Blog', pt: 'Blog' },
    readMore: { en: 'Read More', pt: 'Ler mais' },
    publishedOn: { en: 'Published on', pt: 'Publicado em' },
    tags: { en: 'Tags', pt: 'Tags' },
    noPosts: { en: 'No posts yet', pt: 'Nenhum post ainda' },
    minuteRead: { en: 'min read', pt: 'min de leitura' },
  },

  // 404 Page
  notFound: {
    title: { en: 'Page Not Found', pt: 'Página não encontrada' },
    description: { en: 'The page you requested does not exist or has been moved.', pt: 'A página que você solicitou não existe ou foi movida.' },
    backHome: { en: 'Back to Home', pt: 'Voltar ao início' },
  },

  // Index page
  index: {
    welcome: { en: 'Welcome to my blog', pt: 'Bem-vindo ao meu blog' },
    greeting: { en: "Hi, I'm", pt: 'Olá, eu sou' },
    heroDescription: { en: 'A space where I document what I learn while developing and create small projects.', pt: 'Um espaço onde documento o que aprendo enquanto desenvolvo e crio projetos pequenos.' },
    readBlog: { en: 'Read Blog', pt: 'Ler o blog' },
    latestPosts: { en: 'Latest Posts', pt: 'Posts recentes' },
    recentPosts: { en: 'Recent Posts', pt: 'Posts recentes' },
    viewAll: { en: 'View All', pt: 'Ver todos' },
    noPosts: { en: 'No posts yet', pt: 'Nenhum post ainda' },
    comingSoon: { en: 'The first post will be up soon!', pt: 'O primeiro post sai em breve!' },
    webTools: { en: 'Web Tools', pt: 'Ferramentas web' },
    popularTools: { en: 'Popular Tools', pt: 'Ferramentas populares' },
    seeAllTools: { en: ' tools available', pt: ' ferramentas disponíveis' },
    gameCenterOpen: { en: 'Games', pt: 'Jogos' },
    gameCenterDesc: { en: 'Free browser games — snake, 2048, roulette, typing, and more. Play instantly at /games.', pt: 'Jogos grátis no navegador — snake, 2048, roleta, digitação e mais. Jogue na hora em /games.' },
    playNow: { en: 'Play Now', pt: 'Jogar agora' },
    sideProjects: { en: 'Side Projects', pt: 'Projetos paralelos' },
    gameCenter: { en: 'Games', pt: 'Jogos' },
    sixFreeGames: { en: 'Free online mini games', pt: 'Minijogos online grátis' },
    roulette: { en: 'Roulette', pt: 'Roleta' },
    rouletteDesc: { en: 'Custom random roulette wheel', pt: 'Roleta aleatória personalizada' },
    seeMore: { en: 'See More', pt: 'Ver mais' },
    noProjectsYet: { en: 'No projects right now', pt: 'Nenhum projeto no momento' },
    noProjectsHint: { en: 'Check back later — new work will show up when it is ready to share.', pt: 'Volte mais tarde — novos trabalhos aparecem quando estiverem prontos para compartilhar.' },
    browseGames: { en: 'Browse games', pt: 'Explorar jogos' },
    // Tool names
    jsonFormatter: { en: 'JSON Formatter', pt: 'Formatador JSON' },
    qrCode: { en: 'QR Code', pt: 'QR Code' },
    colorConverter: { en: 'Color Converter', pt: 'Conversor de cores' },
    imageResizer: { en: 'Image Resizer', pt: 'Redimensionador de imagens' },
    base64: { en: 'Base64', pt: 'Base64' },
    utmBuilder: { en: 'UTM Builder', pt: 'Gerador de UTM' },
    regexTester: { en: 'Regex Tester', pt: 'Testador de regex' },
    passwordGenerator: { en: 'Password Generator', pt: 'Gerador de senhas' },
  },

  // Breadcrumb
  breadcrumb: {
    home: { en: 'Home', pt: 'Início' },
  },

  // FAQ
  faq: {
    title: { en: 'FAQ', pt: 'Perguntas frequentes' },
  },
} as const;

export type CommonTranslationKey = keyof typeof commonTranslations;
