// Tool translations
import type { Language } from '../index';

export const toolTranslations = {
  // Common
  common: {
    copy: { en: 'Copy', pt: 'Copiar' },
    copied: { en: 'Copied!', pt: 'Copiado!' },
    generate: { en: 'Generate', pt: 'Gerar' },
    reset: { en: 'Reset', pt: 'Redefinir' },
    download: { en: 'Download', pt: 'Baixar' },
    clear: { en: 'Clear', pt: 'Limpar' },
    input: { en: 'Input', pt: 'Entrada' },
    output: { en: 'Output', pt: 'Saída' },
    result: { en: 'Result', pt: 'Resultado' },
    error: { en: 'Error', pt: 'Erro' },
    start: { en: 'Start', pt: 'Iniciar' },
    stop: { en: 'Stop', pt: 'Parar' },
    pause: { en: 'Pause', pt: 'Pausar' },
    resume: { en: 'Resume', pt: 'Retomar' },
    // RelatedTools, FavoriteButton, ShareButton
    relatedTools: { en: 'Related Tools', pt: 'Ferramentas relacionadas' },
    favorite: { en: 'Favorite', pt: 'Favorito' },
    favorited: { en: 'Favorited', pt: 'Favoritado' },
    addToFavorite: { en: 'Add to favorites', pt: 'Adicionar aos favoritos' },
    removeFromFavorite: { en: 'Remove from favorites', pt: 'Remover dos favoritos' },
    share: { en: 'Share', pt: 'Compartilhar' },
    copyLink: { en: 'Copy link', pt: 'Copiar link' },
  },

  // QR Code Generator
  qrCode: {
    title: { en: 'QR Code Generator', pt: 'Gerador de QR Code' },
    description: { en: 'Convert URL or text to QR code', pt: 'Converta URL ou texto em QR Code' },
    inputPlaceholder: { en: 'Enter URL or text', pt: 'Digite a URL ou o texto' },
    size: { en: 'Size', pt: 'Tamanho' },
    downloadPng: { en: 'Download PNG', pt: 'Baixar PNG' },
  },

  // Password Generator
  password: {
    title: { en: 'Password Generator', pt: 'Gerador de senhas' },
    description: { en: 'Generate secure passwords', pt: 'Gere senhas seguras' },
    length: { en: 'Length', pt: 'Comprimento' },
    uppercase: { en: 'Uppercase (A-Z)', pt: 'Maiúsculas (A-Z)' },
    lowercase: { en: 'Lowercase (a-z)', pt: 'Minúsculas (a-z)' },
    numbers: { en: 'Numbers (0-9)', pt: 'Números (0-9)' },
    symbols: { en: 'Symbols (!@#$...)', pt: 'Símbolos (!@#$...)' },
    strength: { en: 'Strength', pt: 'Força' },
    weak: { en: 'Weak', pt: 'Fraca' },
    medium: { en: 'Medium', pt: 'Média' },
    strong: { en: 'Strong', pt: 'Forte' },
    veryStrong: { en: 'Very Strong', pt: 'Muito forte' },
  },

  // Color Converter
  color: {
    title: { en: 'Color Converter', pt: 'Conversor de cores' },
    description: { en: 'Convert HEX, RGB, HSL colors', pt: 'Converta cores HEX, RGB e HSL' },
    hex: { en: 'HEX', pt: 'HEX' },
    rgb: { en: 'RGB', pt: 'RGB' },
    hsl: { en: 'HSL', pt: 'HSL' },
    preview: { en: 'Preview', pt: 'Pré-visualização' },
  },

  // Unit Converter
  unit: {
    title: { en: 'Unit Converter', pt: 'Conversor de unidades' },
    description: { en: 'Convert length, weight, temperature', pt: 'Converta comprimento, peso e temperatura' },
    length: { en: 'Length', pt: 'Comprimento' },
    weight: { en: 'Weight', pt: 'Peso' },
    temperature: { en: 'Temperature', pt: 'Temperatura' },
    area: { en: 'Area', pt: 'Área' },
    volume: { en: 'Volume', pt: 'Volume' },
    from: { en: 'From', pt: 'De' },
    to: { en: 'To', pt: 'Para' },
  },

  // Text Counter
  textCounter: {
    title: { en: 'Text Counter', pt: 'Contador de texto' },
    description: { en: 'Count characters, words, lines', pt: 'Conte caracteres, palavras e linhas' },
    characters: { en: 'Characters', pt: 'Caracteres' },
    charactersNoSpace: { en: 'Characters (no spaces)', pt: 'Caracteres (sem espaços)' },
    words: { en: 'Words', pt: 'Palavras' },
    lines: { en: 'Lines', pt: 'Linhas' },
    sentences: { en: 'Sentences', pt: 'Frases' },
    paragraphs: { en: 'Paragraphs', pt: 'Parágrafos' },
    placeholder: { en: 'Enter your text...', pt: 'Digite seu texto...' },
  },

  // Base64
  base64: {
    title: { en: 'Base64 Encoder/Decoder', pt: 'Codificador/Decodificador Base64' },
    description: { en: 'Encode/decode text to Base64', pt: 'Codifique e decodifique texto em Base64' },
    encode: { en: 'Encode', pt: 'Codificar' },
    decode: { en: 'Decode', pt: 'Decodificar' },
    inputPlaceholder: { en: 'Enter text', pt: 'Digite o texto' },
    invalidBase64: { en: 'Invalid Base64', pt: 'Base64 inválido' },
  },

  // JSON Formatter
  json: {
    title: { en: 'JSON Formatter', pt: 'Formatador de JSON' },
    description: { en: 'Format and validate JSON', pt: 'Formate e valide JSON' },
    format: { en: 'Format', pt: 'Formatar' },
    minify: { en: 'Minify', pt: 'Minificar' },
    validate: { en: 'Validate', pt: 'Validar' },
    valid: { en: 'Valid JSON', pt: 'JSON válido' },
    invalid: { en: 'Invalid JSON', pt: 'JSON inválido' },
    inputPlaceholder: { en: 'Enter JSON', pt: 'Digite o JSON' },
  },

  // Timer
  timer: {
    title: { en: 'Timer / Stopwatch', pt: 'Timer / Cronômetro' },
    description: { en: 'Timer and Stopwatch', pt: 'Timer e cronômetro' },
    timerTab: { en: 'Timer', pt: 'Timer' },
    stopwatchTab: { en: 'Stopwatch', pt: 'Cronômetro' },
    hours: { en: 'h', pt: 'h' },
    minutes: { en: 'm', pt: 'm' },
    seconds: { en: 's', pt: 's' },
    lap: { en: 'Lap', pt: 'Volta' },
    timeUp: { en: 'Time\'s up!', pt: 'Tempo esgotado!' },
  },

  // UUID Generator
  uuid: {
    title: { en: 'UUID Generator', pt: 'Gerador de UUID' },
    description: { en: 'Generate UUID v4', pt: 'Gere UUID v4' },
    version: { en: 'Version', pt: 'Versão' },
    count: { en: 'Count', pt: 'Quantidade' },
    uppercase: { en: 'Uppercase', pt: 'Maiúsculas' },
    hyphens: { en: 'Include hyphens', pt: 'Incluir hífens' },
  },

  // Hash Generator
  hash: {
    title: { en: 'Hash Generator', pt: 'Gerador de hash' },
    description: { en: 'Generate MD5, SHA-1, SHA-256 hash', pt: 'Gere hash MD5, SHA-1 e SHA-256' },
    algorithm: { en: 'Algorithm', pt: 'Algoritmo' },
    inputPlaceholder: { en: 'Enter text to hash', pt: 'Digite o texto para gerar o hash' },
  },

  // Regex Tester
  regex: {
    title: { en: 'Regex Tester', pt: 'Testador de regex' },
    description: { en: 'Test regex and check matches', pt: 'Teste regex e veja as correspondências' },
    pattern: { en: 'Pattern', pt: 'Padrão' },
    flags: { en: 'Flags', pt: 'Flags' },
    testString: { en: 'Test String', pt: 'Texto de teste' },
    matches: { en: 'Matches', pt: 'Correspondências' },
    noMatch: { en: 'No match', pt: 'Nenhuma correspondência' },
    groups: { en: 'Groups', pt: 'Grupos' },
  },

  // Lorem Ipsum
  loremIpsum: {
    title: { en: 'Lorem Ipsum Generator', pt: 'Gerador de Lorem Ipsum' },
    description: { en: 'Generate dummy text', pt: 'Gere texto de exemplo' },
    paragraphs: { en: 'Paragraphs', pt: 'Parágrafos' },
    sentences: { en: 'Sentences', pt: 'Frases' },
    words: { en: 'Words', pt: 'Palavras' },
    count: { en: 'Count', pt: 'Quantidade' },
    startWithLorem: { en: 'Start with "Lorem ipsum"', pt: 'Começar com "Lorem ipsum"' },
  },

  // Markdown Preview
  markdown: {
    title: { en: 'Markdown Preview', pt: 'Pré-visualização de Markdown' },
    description: { en: 'Live markdown preview', pt: 'Pré-visualização de Markdown em tempo real' },
    editor: { en: 'Editor', pt: 'Editor' },
    preview: { en: 'Preview', pt: 'Pré-visualização' },
    placeholder: { en: 'Enter markdown...', pt: 'Digite o Markdown...' },
  },

  // Color Palette
  colorPalette: {
    title: { en: 'Color Palette Generator', pt: 'Gerador de paleta de cores' },
    description: { en: 'Generate harmonious color palettes', pt: 'Gere paletas de cores harmoniosas' },
    baseColor: { en: 'Base Color', pt: 'Cor base' },
    harmony: { en: 'Harmony', pt: 'Harmonia' },
    complementary: { en: 'Complementary', pt: 'Complementar' },
    triadic: { en: 'Triadic', pt: 'Triádica' },
    analogous: { en: 'Analogous', pt: 'Análoga' },
    splitComplementary: { en: 'Split Complementary', pt: 'Complementar dividida' },
    tetradic: { en: 'Tetradic', pt: 'Tetrádica' },
    monochromatic: { en: 'Monochromatic', pt: 'Monocromática' },
  },

  // Image Resizer
  imageResizer: {
    title: { en: 'Image Resizer', pt: 'Redimensionador de imagens' },
    description: { en: 'Image resizer with live crop and preset size conversion', pt: 'Redimensione imagens com recorte ao vivo e tamanhos predefinidos' },
    dropzone: { en: 'Drag or click to upload image', pt: 'Arraste ou clique para enviar a imagem' },
    mode: { en: 'Mode', pt: 'Modo' },
    customMode: { en: 'Custom', pt: 'Personalizado' },
    presetMode: { en: 'Preset', pt: 'Predefinido' },
    preset: { en: 'Preset', pt: 'Predefinição' },
    presetOutput: { en: 'Selected preset', pt: 'Predefinição selecionada' },
    presetHint: { en: 'Preset mode automatically resizes to the selected output dimensions.', pt: 'O modo predefinido redimensiona automaticamente para as dimensões de saída selecionadas.' },
    width: { en: 'Width', pt: 'Largura' },
    height: { en: 'Height', pt: 'Altura' },
    keepAspectRatio: { en: 'Keep aspect ratio', pt: 'Manter proporção' },
    quality: { en: 'Quality', pt: 'Qualidade' },
    format: { en: 'Format', pt: 'Formato' },
    crop: { en: 'Crop', pt: 'Recortar' },
    cropFree: { en: 'Free Ratio', pt: 'Proporção livre' },
    cropLocked: { en: 'Lock to Output Ratio', pt: 'Travar na proporção de saída' },
    autoApplied: { en: 'Crop and setting changes are automatically applied to the preview.', pt: 'Alterações de recorte e configurações são aplicadas automaticamente à pré-visualização.' },
    livePreview: { en: 'Adjust crop or settings to update the result in real time.', pt: 'Ajuste o recorte ou as configurações para atualizar o resultado em tempo real.' },
    outputSize: { en: 'Output Size', pt: 'Tamanho de saída' },
    original: { en: 'Original', pt: 'Original' },
    resized: { en: 'Resized', pt: 'Redimensionada' },
  },

  // Background Remover
  backgroundRemover: {
    title: { en: 'Background Remover', pt: 'Removedor de fundo' },
    description: { en: 'Automatically remove background from images', pt: 'Remova automaticamente o fundo das imagens' },
    dropzone: { en: 'Drag or click to upload image', pt: 'Arraste ou clique para enviar a imagem' },
    removeButton: { en: 'Remove Background', pt: 'Remover fundo' },
    processing: { en: 'Processing', pt: 'Processando' },
    original: { en: 'Original', pt: 'Original' },
    result: { en: 'Result', pt: 'Resultado' },
    clickRemove: { en: 'Click remove background button', pt: 'Clique no botão Remover fundo' },
    backgroundColor: { en: 'Background Color', pt: 'Cor de fundo' },
    transparent: { en: 'Transparent', pt: 'Transparente' },
    white: { en: 'White', pt: 'Branco' },
    black: { en: 'Black', pt: 'Preto' },
    customColor: { en: 'Custom', pt: 'Personalizado' },
    errorMessage: { en: 'Error occurred while removing background. Please try again.', pt: 'Ocorreu um erro ao remover o fundo. Tente novamente.' },
    infoNote: { en: 'All image processing is done locally in your browser. Images are not sent to any server.', pt: 'Todo o processamento da imagem é feito localmente no seu navegador. As imagens não são enviadas a nenhum servidor.' },
  },

  // LLM Cost Calculator
  llmCost: {
    title: { en: 'LLM Cost Calculator', pt: 'Calculadora de custo de LLM' },
    description: { en: 'Compare API costs across AI models', pt: 'Compare os custos de API entre modelos de IA' },

    // Input modes
    textMode: { en: 'Calculate tokens from text', pt: 'Calcular tokens a partir do texto' },
    manualMode: { en: 'Enter token count manually', pt: 'Informar quantidade de tokens manualmente' },

    // Labels
    inputText: { en: 'Input Text', pt: 'Texto de entrada' },
    outputText: { en: 'Output Text - Expected Response', pt: 'Texto de saída — resposta esperada' },
    inputTokens: { en: 'Input Tokens', pt: 'Tokens de entrada' },
    outputTokens: { en: 'Output Tokens', pt: 'Tokens de saída' },
    outputTokensAlt: { en: 'Or enter output tokens manually', pt: 'Ou informe os tokens de saída manualmente' },
    requestCount: { en: 'Request Count', pt: 'Quantidade de requisições' },

    // Placeholders
    inputPlaceholder: { en: 'Enter your prompt...', pt: 'Digite seu prompt...' },
    outputPlaceholder: { en: 'Enter expected output text, or manually enter output token count below...', pt: 'Digite o texto de saída esperado ou informe manualmente a quantidade de tokens de saída abaixo...' },

    // Presets
    presetShort: { en: 'Short Answer', pt: 'Resposta curta' },
    presetNormal: { en: 'Normal Chat', pt: 'Chat normal' },
    presetLong: { en: 'Long Writing', pt: 'Texto longo' },
    presetCode: { en: 'Code Generation', pt: 'Geração de código' },
    presetDoc: { en: 'Document Analysis', pt: 'Análise de documento' },
    presetBulk: { en: 'Bulk Processing (1000)', pt: 'Processamento em lote (1000)' },

    // Token summary
    inputTokensSummary: { en: 'Input Tokens', pt: 'Tokens de entrada' },
    outputTokensSummary: { en: 'Output Tokens', pt: 'Tokens de saída' },
    requestsSummary: { en: 'Requests', pt: 'Requisições' },

    // Currency
    currencySelect: { en: 'Select Currency', pt: 'Selecionar moeda' },
    exchangeSettings: { en: 'Exchange Rate Settings', pt: 'Configurações de câmbio' },
    exchangeClose: { en: 'Close Exchange Settings', pt: 'Fechar configurações de câmbio' },
    exchangeRate: { en: 'Exchange rate per $1 USD', pt: 'Taxa de câmbio por US$ 1' },
    fetchRates: { en: 'Fetch Live Rates', pt: 'Buscar taxas ao vivo' },
    fetchingRates: { en: 'Fetching...', pt: 'Buscando...' },
    ratesError: { en: 'Could not fetch exchange rates.', pt: 'Não foi possível buscar as taxas de câmbio.' },
    networkError: { en: 'Network error occurred.', pt: 'Ocorreu um erro de rede.' },
    lastUpdated: { en: 'Last updated', pt: 'Última atualização' },
    defaultRates: { en: 'Using default rates', pt: 'Usando taxas padrão' },
    exchangeSource: { en: 'Source', pt: 'Fonte' },

    // Currency names
    currencyUsd: { en: 'USD', pt: 'USD' },
    currencyJpy: { en: 'JPY', pt: 'JPY' },
    currencyEur: { en: 'EUR', pt: 'EUR' },

    // Provider filter
    providerFilter: { en: 'Provider Filter (Multi-select)', pt: 'Filtro de provedores (seleção múltipla)' },
    selectAll: { en: 'Select All', pt: 'Selecionar todos' },
    deselectAll: { en: 'Deselect All', pt: 'Desmarcar todos' },
    modelSelect: { en: 'Select Models', pt: 'Selecionar modelos' },
    modelSelectClose: { en: 'Close Model Selection', pt: 'Fechar seleção de modelos' },
    select: { en: 'Select', pt: 'Selecionar' },
    deselect: { en: 'Deselect', pt: 'Desmarcar' },

    // Table headers
    model: { en: 'Model', pt: 'Modelo' },
    inputCost: { en: 'Input Cost', pt: 'Custo de entrada' },
    outputCost: { en: 'Output Cost', pt: 'Custo de saída' },
    totalCost: { en: 'Total Cost', pt: 'Custo total' },
    comparison: { en: 'Comparison', pt: 'Comparação' },
    lowest: { en: 'Lowest', pt: 'Mais baixo' },
    selectModels: { en: 'Select models to compare.', pt: 'Selecione os modelos para comparar.' },

    // Pricing table
    pricingTable: { en: 'Price per Token by Model', pt: 'Preço por token por modelo' },
    pricePer1kInput: { en: 'Per 1K Input', pt: 'Por 1K de entrada' },
    pricePer1kOutput: { en: 'Per 1K Output', pt: 'Por 1K de saída' },
    maxInput: { en: 'Max Input', pt: 'Entrada máxima' },
    maxOutput: { en: 'Max Output', pt: 'Saída máxima' },

    // Notes section
    notes: { en: 'Notes', pt: 'Observações' },
    priceDate: { en: 'Prices as of January 2025. Check official sites for current pricing.', pt: 'Preços de janeiro de 2025. Consulte os sites oficiais para valores atualizados.' },
    tokenEstimation: { en: 'Token estimation: ~4 English chars per token, ~2 CJK chars per token', pt: 'Estimativa de tokens: ~4 caracteres em inglês por token, ~2 caracteres CJK por token' },
    cjkTokenNote: { en: 'CJK characters are estimated at ~2 characters per token.', pt: 'Caracteres CJK são estimados em ~2 caracteres por token.' },
    exchangeNote: { en: 'Exchange rates are auto-fetched from', pt: 'As taxas de câmbio são buscadas automaticamente de' },
    exchangeNoteSuffix: { en: 'on page load.', pt: 'ao carregar a página.' },

    // Token references
    tokenReference: { en: 'Token Calculation Reference', pt: 'Referência de cálculo de tokens' },
    openaiTokenizer: { en: 'Tokenizer for GPT models', pt: 'Tokenizer para modelos GPT' },
    anthropicTokens: { en: 'Token counting API for Claude models', pt: 'API de contagem de tokens para modelos Claude' },
    geminiTokens: { en: 'Token guide for Gemini models', pt: 'Guia de tokens para modelos Gemini' },

    // Price sources
    priceSources: { en: 'Pricing Sources', pt: 'Fontes de preços' },
    priceSourceNote: { en: 'Check the official pricing pages below for latest information:', pt: 'Consulte as páginas oficiais de preços abaixo para as informações mais recentes:' },

    // Character count
    characters: { en: 'chars', pt: 'caracteres' },
    tokensEstimated: { en: 'tokens (est.)', pt: 'tokens (est.)' },
  },

  // Age Calculator
  age: {
    title: { en: 'Age Calculator', pt: 'Calculadora de idade' },
    description: { en: 'Calculate age from birthdate', pt: 'Calcule a idade a partir da data de nascimento' },
    birthDate: { en: 'Birth Date', pt: 'Data de nascimento' },
    internationalAge: { en: 'International Age', pt: 'Idade internacional' },
    years: { en: ' years old', pt: ' anos' },
    exactAge: { en: 'Exact Age', pt: 'Idade exata' },
    yearsMonthsDays: { en: ' years ', pt: ' anos ' },
    monthsUnit: { en: ' months ', pt: ' meses ' },
    daysUnit: { en: ' days', pt: ' dias' },
    daysLived: { en: 'Days Lived', pt: 'Dias vividos' },
    untilBirthday: { en: 'Until Birthday', pt: 'Até o aniversário' },
    todayBirthday: { en: 'Today!', pt: 'Hoje!' },
    zodiac: { en: 'Zodiac', pt: 'Signo' },
    chineseZodiac: { en: 'Chinese Zodiac', pt: 'Zodíaco chinês' },
    funStats: { en: 'Fun Statistics', pt: 'Estatísticas divertidas' },
    hoursLived: { en: 'hours lived', pt: 'horas vividas' },
    minutesPassed: { en: 'minutes passed', pt: 'minutos passados' },
    weeksSpent: { en: 'weeks spent', pt: 'semanas vividas' },
    heartbeats: { en: 'heartbeats', pt: 'batimentos cardíacos' },
    // Zodiac signs
    capricorn: { en: 'Capricorn', pt: 'Capricórnio' },
    aquarius: { en: 'Aquarius', pt: 'Aquário' },
    pisces: { en: 'Pisces', pt: 'Peixes' },
    aries: { en: 'Aries', pt: 'Áries' },
    taurus: { en: 'Taurus', pt: 'Touro' },
    gemini: { en: 'Gemini', pt: 'Gêmeos' },
    cancer: { en: 'Cancer', pt: 'Câncer' },
    leo: { en: 'Leo', pt: 'Leão' },
    virgo: { en: 'Virgo', pt: 'Virgem' },
    libra: { en: 'Libra', pt: 'Libra' },
    scorpio: { en: 'Scorpio', pt: 'Escorpião' },
    sagittarius: { en: 'Sagittarius', pt: 'Sagitário' },
    // Chinese zodiac
    monkey: { en: 'Monkey', pt: 'Macaco' },
    rooster: { en: 'Rooster', pt: 'Galo' },
    dog: { en: 'Dog', pt: 'Cão' },
    pig: { en: 'Pig', pt: 'Porco' },
    rat: { en: 'Rat', pt: 'Rato' },
    ox: { en: 'Ox', pt: 'Boi' },
    tiger: { en: 'Tiger', pt: 'Tigre' },
    rabbit: { en: 'Rabbit', pt: 'Coelho' },
    dragon: { en: 'Dragon', pt: 'Dragão' },
    snake: { en: 'Snake', pt: 'Serpente' },
    horse: { en: 'Horse', pt: 'Cavalo' },
    sheep: { en: 'Sheep', pt: 'Ovelha' },
  },

  // BMI Calculator
  bmi: {
    title: { en: 'BMI Calculator', pt: 'Calculadora de IMC' },
    description: { en: 'Calculate Body Mass Index', pt: 'Calcule o Índice de Massa Corporal' },
    height: { en: 'Height (cm)', pt: 'Altura (cm)' },
    weight: { en: 'Weight (kg)', pt: 'Peso (kg)' },
    calculate: { en: 'Calculate BMI', pt: 'Calcular IMC' },
    myBmi: { en: 'My BMI', pt: 'Meu IMC' },
    idealWeight: { en: 'Ideal Weight Range', pt: 'Faixa de peso ideal' },
    underweight: { en: 'Underweight', pt: 'Abaixo do peso' },
    normal: { en: 'Normal', pt: 'Normal' },
    overweight: { en: 'Overweight', pt: 'Sobrepeso' },
    obese1: { en: 'Obese Class I', pt: 'Obesidade grau I' },
    obese2: { en: 'Obese Class II', pt: 'Obesidade grau II' },
    extremelyObese: { en: 'Extremely Obese', pt: 'Obesidade extrema' },
    underweightDesc: { en: 'You are underweight. Maintain a healthy weight with a balanced diet.', pt: 'Você está abaixo do peso. Mantenha um peso saudável com uma alimentação equilibrada.' },
    normalDesc: { en: 'You have a healthy weight. Keep it up!', pt: 'Você está com um peso saudável. Continue assim!' },
    overweightDesc: { en: 'Pre-obesity stage. Diet and exercise recommended.', pt: 'Estágio de pré-obesidade. Dieta e exercícios são recomendados.' },
    obese1Desc: { en: 'Health management needed. Professional consultation recommended.', pt: 'É necessário cuidar da saúde. Consulte um profissional.' },
    obese2Desc: { en: 'High health risk. Consult a medical professional.', pt: 'Alto risco à saúde. Consulte um profissional médico.' },
    extremelyObeseDesc: { en: 'Serious health risk. Immediate medical consultation needed.', pt: 'Risco grave à saúde. Consulte um médico imediatamente.' },
    bmiTable: { en: 'BMI Reference (Asia-Pacific)', pt: 'Referência de IMC (Ásia-Pacífico)' },
    disclaimer: { en: 'BMI is for reference only. Consult a professional for accurate health status.', pt: 'O IMC é apenas uma referência. Consulte um profissional para avaliar sua saúde com precisão.' },
    lessThan: { en: 'under', pt: 'abaixo de' },
    orMore: { en: 'or more', pt: 'ou mais' },
  },

  // Timestamp Converter
  timestamp: {
    title: { en: 'Timestamp Converter', pt: 'Conversor de timestamp' },
    description: { en: 'Convert Unix timestamps', pt: 'Converta timestamps Unix' },
    currentTimestamp: { en: 'Current Unix Timestamp', pt: 'Timestamp Unix atual' },
    copyAndUse: { en: 'Copy & Use', pt: 'Copiar e usar' },
    seconds: { en: 'Seconds', pt: 'Segundos' },
    milliseconds: { en: 'Milliseconds', pt: 'Milissegundos' },
    timestampToDate: { en: 'Timestamp → Date', pt: 'Timestamp → Data' },
    dateToTimestamp: { en: 'Date → Timestamp', pt: 'Data → Timestamp' },
    localTime: { en: 'Local Time', pt: 'Horário local' },
    relativeTime: { en: 'Relative Time', pt: 'Tempo relativo' },
    commonTimestamps: { en: 'Common Timestamps', pt: 'Timestamps comuns' },
    inOneHour: { en: 'In 1 hour', pt: 'Em 1 hora' },
    tomorrow: { en: 'Tomorrow', pt: 'Amanhã' },
    inOneWeek: { en: 'In 1 week', pt: 'Em 1 semana' },
    inOneMonth: { en: 'In 1 month', pt: 'Em 1 mês' },
    whatIsTimestamp: { en: 'What is Unix Timestamp?', pt: 'O que é Unix Timestamp?' },
    timestampExplanation: { en: 'A value representing the time elapsed since January 1, 1970 00:00:00 UTC in seconds (or milliseconds). Widely used in programming for handling time.', pt: 'Um valor que representa o tempo decorrido desde 1º de janeiro de 1970, 00:00:00 UTC, em segundos (ou milissegundos). Amplamente usado em programação para lidar com tempo.' },
    ago: { en: 'ago', pt: 'atrás' },
    later: { en: 'later', pt: 'depois' },
    yearsAgo: { en: ' year(s)', pt: ' ano(s)' },
    monthsAgo: { en: ' month(s)', pt: ' mês(es)' },
    daysAgo: { en: ' day(s)', pt: ' dia(s)' },
    hoursAgo: { en: ' hour(s)', pt: ' hora(s)' },
    minutesAgo: { en: ' minute(s)', pt: ' minuto(s)' },
    secondsAgo: { en: ' second(s)', pt: ' segundo(s)' },
  },

  // D-Day Calculator
  dday: {
    title: { en: 'D-Day Calculator', pt: 'Calculadora de D-Day' },
    description: { en: 'Calculate days until a specific date', pt: 'Calcule os dias até uma data específica' },
    targetDate: { en: 'Target Date', pt: 'Data alvo' },
    eventName: { en: 'Event Name (Optional)', pt: 'Nome do evento (opcional)' },
    daysRemaining: { en: 'Days Remaining', pt: 'Dias restantes' },
    daysPassed: { en: 'Days Passed', pt: 'Dias passados' },
    today: { en: 'Today', pt: 'Hoje' },
    addEvent: { en: 'Add Event', pt: 'Adicionar evento' },
    savedEvents: { en: 'Saved Events', pt: 'Eventos salvos' },
    noEvents: { en: 'No saved events', pt: 'Nenhum evento salvo' },
  },

  // Discount Calculator
  discount: {
    title: { en: 'Discount Calculator', pt: 'Calculadora de desconto' },
    description: { en: 'Calculate discount amount and final price', pt: 'Calcule o valor do desconto e o preço final' },
    originalPrice: { en: 'Original Price', pt: 'Preço original' },
    discountRate: { en: 'Discount Rate (%)', pt: 'Taxa de desconto (%)' },
    discountAmount: { en: 'Discount Amount', pt: 'Valor do desconto' },
    finalPrice: { en: 'Final Price', pt: 'Preço final' },
    youSave: { en: 'You Save', pt: 'Você economiza' },
  },

  // Dutch Pay Calculator
  dutchPay: {
    title: { en: 'Split Bill Calculator', pt: 'Calculadora de divisão de conta' },
    description: { en: 'Split total amount by number of people', pt: 'Divida o valor total pelo número de pessoas' },
    totalAmount: { en: 'Total Amount', pt: 'Valor total' },
    numberOfPeople: { en: 'Number of People', pt: 'Número de pessoas' },
    perPerson: { en: 'Per Person', pt: 'Por pessoa' },
    remainder: { en: 'Remainder', pt: 'Resto' },
    addExtra: { en: 'Additional Amount', pt: 'Valor adicional' },
  },

  // Tools page
  toolsPage: {
    title: { en: 'Online Tools', pt: 'Ferramentas online' },
    description: { en: 'Collection of useful web tools', pt: 'Coleção de ferramentas web úteis' },
    allTools: { en: 'All Tools', pt: 'Todas as ferramentas' },
    generators: { en: 'Generators', pt: 'Geradores' },
    converters: { en: 'Converters', pt: 'Conversores' },
    text: { en: 'Text', pt: 'Texto' },
    developer: { en: 'Developer', pt: 'Desenvolvedor' },
    image: { en: 'Image', pt: 'Imagem' },
  },

  // App Store Screenshot Resizer
  appStoreScreenshot: {
    title: { en: 'App Store Screenshot Resizer', pt: 'Redimensionador de screenshots da App Store' },
    description: { en: 'Free iOS App Store screenshot resizer', pt: 'Redimensionador gratuito de screenshots da App Store iOS' },
    dropzone: { en: 'Drag or click to upload images (max 10)', pt: 'Arraste ou clique para enviar imagens (máx. 10)' },
    selectDevice: { en: 'Select Device', pt: 'Selecionar dispositivo' },
    selectSize: { en: 'Select Size', pt: 'Selecionar tamanho' },
    orientation: { en: 'Orientation', pt: 'Orientação' },
    portrait: { en: 'Portrait', pt: 'Retrato' },
    landscape: { en: 'Landscape', pt: 'Paisagem' },
    adjustCrop: { en: 'Adjust Crop Area', pt: 'Ajustar área de recorte' },
    applyToAll: { en: 'Apply to All', pt: 'Aplicar a todos' },
    downloadAll: { en: 'Download All', pt: 'Baixar todos' },
    processAll: { en: 'Process All', pt: 'Processar todos' },
  },
} as const;

export type ToolTranslationKey = keyof typeof toolTranslations;
