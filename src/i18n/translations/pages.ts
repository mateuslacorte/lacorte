// Page-level UI translations (English-only, i18n-ready)
import type { Language } from '../index';

type T = Record<Language, string>;

export const pageTranslations = {
  footer: {
    siteInfo: { en: 'Site information', pt: 'Informações do site' } as T,
    about: { en: 'About', pt: 'Sobre' } as T,
    contact: { en: 'Contact', pt: 'Contato' } as T,
    privacy: { en: 'Privacy Policy', pt: 'Política de privacidade' } as T,
  },
  about: {
    title: { en: 'About | lacorte.dev', pt: 'Sobre | lacorte.dev' } as T,
    description: {
      en: "Learn about lacorte.dev and this site's development notes, tools, projects, and editorial principles.",
      pt: 'Conheça o lacorte.dev e as notas de desenvolvimento, ferramentas, projetos e princípios editoriais deste site.',
    } as T,
    heading: { en: 'Building and verifying what we share', pt: 'Construindo e verificando o que compartilhamos' } as T,
    intro: {
      en: 'lacorte.dev is a personal developer site for knowledge gained while building, plus web tools, games, and side projects made in-house.',
      pt: 'lacorte.dev é um site pessoal de desenvolvimento com o conhecimento adquirido ao construir, além de ferramentas web, jogos e projetos paralelos feitos internamente.',
    } as T,
    topicsHeading: { en: 'What we cover', pt: 'O que abordamos' } as T,
    topicsBody: {
      en: 'We focus on AI agents and developer tools, software architecture, web development, and machine learning experiments. Alongside blog posts, we publish tools you can use in the browser and concrete implementation results.',
      pt: 'Focamos em agentes de IA e ferramentas de desenvolvimento, arquitetura de software, desenvolvimento web e experimentos de machine learning. Além dos posts do blog, publicamos ferramentas que você pode usar no navegador e resultados concretos de implementação.',
    } as T,
    principlesHeading: { en: 'Editorial principles', pt: 'Princípios editoriais' } as T,
    principlesBody1: {
      en: 'Posts start from real development problems, implementation experience, or verifiable sources. When we use external material, we link to the original whenever possible, and we re-check code and technical claims before publishing.',
      pt: 'Os posts partem de problemas reais de desenvolvimento, experiência de implementação ou fontes verificáveis. Quando usamos material externo, linkamos o original sempre que possível, e revisamos código e afirmações técnicas antes de publicar.',
    } as T,
    principlesBody2: {
      en: 'AI tools may help with research and drafts, but we do not mass-publish raw generated output. The operator reviews and decides what gets published.',
      pt: 'Ferramentas de IA podem ajudar na pesquisa e nos rascunhos, mas não publicamos em massa saída bruta gerada. O operador revisa e decide o que é publicado.',
    } as T,
    operatorHeading: { en: 'Operator', pt: 'Operador' } as T,
    operatorBody: {
      en: 'lacorte.dev operates this site directly. Public work and history are on',
      pt: 'lacorte.dev opera este site diretamente. O trabalho público e o histórico estão em',
    } as T,
    and: { en: 'and', pt: 'e' } as T,
  },
  contact: {
    title: { en: 'Contact | lacorte.dev', pt: 'Contato | lacorte.dev' } as T,
    description: {
      en: 'How to reach lacorte.dev about content, tools, projects, and privacy questions.',
      pt: 'Como falar com o lacorte.dev sobre conteúdo, ferramentas, projetos e dúvidas de privacidade.',
    } as T,
    heading: { en: 'Get in touch', pt: 'Entre em contato' } as T,
    intro: {
      en: 'Send corrections, tool bugs, privacy questions, or project feedback.',
      pt: 'Envie correções, bugs de ferramentas, dúvidas de privacidade ou feedback sobre projetos.',
    } as T,
    emailHeading: { en: 'Email', pt: 'E-mail' } as T,
    emailHint: {
      en: 'For bug reports, include the page URL and steps to reproduce.',
      pt: 'Para reportar bugs, inclua a URL da página e os passos para reproduzir.',
    } as T,
    githubHint: { en: 'View the public repository and development activity', pt: 'Veja o repositório público e a atividade de desenvolvimento' } as T,
    linkedinHint: { en: 'View the operator profile', pt: 'Veja o perfil do operador' } as T,
  },
  privacy: {
    title: { en: 'Privacy Policy | lacorte.dev', pt: 'Política de privacidade | lacorte.dev' } as T,
    description: {
      en: 'Privacy policy for lacorte.dev analytics, advertising, browser tools, and external links.',
      pt: 'Política de privacidade do lacorte.dev sobre analytics, publicidade, ferramentas no navegador e links externos.',
    } as T,
    heading: { en: 'Privacy Policy', pt: 'Política de privacidade' } as T,
    effectiveDate: { en: 'Effective date: July 23, 2026', pt: 'Data de vigência: 23 de julho de 2026' } as T,
    s1Heading: { en: '1. Site operation', pt: '1. Operação do site' } as T,
    s1Body: {
      en: 'lacorte.dev provides development content and web tools without requiring an account. Information the operator receives directly by email is used only to handle your inquiry.',
      pt: 'O lacorte.dev oferece conteúdo de desenvolvimento e ferramentas web sem exigir conta. As informações que o operador recebe diretamente por e-mail são usadas apenas para atender à sua solicitação.',
    } as T,
    s2Heading: { en: '2. Analytics', pt: '2. Analytics' } as T,
    s2Body: {
      en: "We use Google Analytics to understand how the site is used. Cookies or similar technologies may process visit data such as pages viewed, approximate region, browser and device info, and referral path. Google's handling of data follows Google's privacy policy and product settings.",
      pt: 'Usamos o Google Analytics para entender como o site é usado. Cookies ou tecnologias semelhantes podem processar dados de visita, como páginas visualizadas, região aproximada, informações de navegador e dispositivo, e caminho de referência. O tratamento de dados pelo Google segue a política de privacidade e as configurações do produto da Google.',
    } as T,
    s3Heading: { en: '3. Advertising', pt: '3. Publicidade' } as T,
    s3Body: {
      en: 'If Google AdSense ads are shown in the future, Google and advertising partners may use cookies for ad delivery, frequency capping, measurement, and relevance. You can manage personalized ads in',
      pt: 'Se anúncios do Google AdSense forem exibidos no futuro, a Google e parceiros de publicidade podem usar cookies para entrega de anúncios, limitação de frequência, medição e relevância. Você pode gerenciar anúncios personalizados em',
    } as T,
    adCenter: { en: 'Google Ads Center', pt: 'Central de Anúncios do Google' } as T,
    s4Heading: { en: '4. Browser tools and local storage', pt: '4. Ferramentas no navegador e armazenamento local' } as T,
    s4Body: {
      en: 'Many tools, such as the JSON formatter and text converters, process input inside your browser. Settings like favorites, recently used tools, language, and theme may be stored in browser storage and can be cleared in your browser settings. Pages that use network features may communicate with external services needed to provide that feature.',
      pt: 'Muitas ferramentas, como o formatador JSON e conversores de texto, processam a entrada no seu navegador. Configurações como favoritos, ferramentas usadas recentemente, idioma e tema podem ser armazenadas no armazenamento do navegador e podem ser limpas nas configurações do navegador. Páginas que usam recursos de rede podem se comunicar com serviços externos necessários para oferecer essa função.',
    } as T,
    s5Heading: { en: '5. External links', pt: '5. Links externos' } as T,
    s5Body: {
      en: 'The site includes links to external sites such as GitHub, LinkedIn, and reference materials. Privacy practices on those sites are governed by their own policies.',
      pt: 'O site inclui links para sites externos como GitHub, LinkedIn e materiais de referência. As práticas de privacidade nesses sites são regidas pelas próprias políticas deles.',
    } as T,
    s6Heading: { en: '6. Requests and changes', pt: '6. Solicitações e alterações' } as T,
    s6Body: { en: 'For privacy-related requests, email', pt: 'Para solicitações relacionadas à privacidade, envie um e-mail para' } as T,
  },
  jobs: {
    title: { en: 'IT Jobs | lacorte.dev', pt: 'Vagas de TI | lacorte.dev' } as T,
    description: { en: 'Browse engineering career pages from major tech companies.', pt: 'Navegue pelas páginas de carreira de engenharia das principais empresas de tecnologia.' } as T,
    heading: { en: 'IT Job Listings', pt: 'Vagas de TI' } as T,
    subtitle: { en: 'Career pages from companies hiring engineers', pt: 'Páginas de carreira de empresas que contratam engenheiros' } as T,
    viewJobs: { en: 'View jobs', pt: 'Ver vagas' } as T,
    lastUpdated: { en: 'Last updated', pt: 'Última atualização' } as T,
    loading: { en: 'Loading job sites…', pt: 'Carregando sites de vagas…' } as T,
    error: { en: 'Could not load job data.', pt: 'Não foi possível carregar os dados das vagas.' } as T,
  },
  articles: {
    heading: { en: 'Article Feed', pt: 'Feed de artigos' } as T,
    subtitle: {
      en: 'Browse dev and tech news in one place',
      pt: 'Navegue notícias de desenvolvimento e tecnologia em um só lugar',
    } as T,
    description: {
      en: 'Browse dev and tech news in one place. Follow major sources like Hacker News, IA & Open Source, DEV.to, and TechCrunch in real time.',
      pt: 'Navegue notícias de desenvolvimento e tecnologia em um só lugar. Acompanhe fontes como Hacker News, IA & Open Source, DEV.to e TechCrunch em tempo real.',
    } as T,
    ogLabel: { en: '> ARTICLES', pt: '> ARTIGOS' } as T,
    articlesLabel: { en: 'Articles', pt: 'Artigos' } as T,
    savedLabel: { en: 'Saved', pt: 'Salvos' } as T,
    refresh: { en: 'Refresh', pt: 'Atualizar' } as T,
    loading: { en: 'Loading…', pt: 'Carregando…' } as T,
    tabFeed: { en: 'Feed', pt: 'Feed' } as T,
    tabSaved: { en: 'Saved', pt: 'Salvos' } as T,
    sourceFilter: { en: 'Source filter', pt: 'Filtro de fontes' } as T,
    selected: { en: 'selected', pt: 'selecionadas' } as T,
    reset: { en: 'Reset', pt: 'Limpar' } as T,
    sourcesSelected: { en: 'sources selected', pt: 'fontes selecionadas' } as T,
    showingAllSources: { en: 'Showing all sources', pt: 'Mostrando todas as fontes' } as T,
    catNews: { en: 'All News', pt: 'Todas as notícias' } as T,
    catGlobal: { en: 'All Global', pt: 'Todas as globais' } as T,
    catTechBlog: { en: 'All Tech Blogs', pt: 'Todos os tech blogs' } as T,
    catSocial: { en: 'All Social', pt: 'Todas as redes' } as T,
    applyFilter: { en: 'Apply filter to', pt: 'Aplicar filtro a' } as T,
    sources: { en: 'sources', pt: 'fontes' } as T,
    showAllSources: { en: 'Show all sources', pt: 'Mostrar todas as fontes' } as T,
    loadError: {
      en: 'Failed to load articles. Please try again.',
      pt: 'Falha ao carregar os artigos. Tente novamente.',
    } as T,
    emptyFeed: { en: 'No articles yet.', pt: 'Nenhum artigo ainda.' } as T,
    emptyFeedHint: {
      en: 'New stories appear here as feeds update throughout the day.',
      pt: 'Novas histórias aparecem aqui conforme os feeds atualizam ao longo do dia.',
    } as T,
    emptySaved: { en: 'No saved articles yet.', pt: 'Nenhum artigo salvo ainda.' } as T,
    emptySavedHint: {
      en: 'Save articles from the admin dashboard.',
      pt: 'Salve artigos pelo painel de administração.',
    } as T,
    justNow: { en: 'Just now', pt: 'Agora mesmo' } as T,
    hoursAgo: { en: 'h ago', pt: 'h atrás' } as T,
    daysAgo: { en: 'd ago', pt: 'd atrás' } as T,
  },
  projects: {
    analyzeCurrentPage: { en: 'Analyze Current Page', pt: 'Analisar página atual' } as T,
    installStepAnalyze: {
      en: 'Open a shopping page, click the extension, and select Analyze Current Page.',
      pt: 'Abra uma página de compras, clique na extensão e selecione Analisar página atual.',
    } as T,
  },
};
