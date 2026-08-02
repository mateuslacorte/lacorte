---
title: 'Este Site (Sim, Esse Que Você Está Lendo Agora)'
date: '2026-01-04'
tags:
  - portfólio
  - nextjs
  - vercel
  - meta
description: >-
  Um post meta sobre o lacorte.dev — o site de desenvolvedor bilíngue em que
  você está — e não o antigo blog com estética de terminal Fallout.
---

Então, você está lendo um post de blog... *sobre o site que você está lendo*. Que delicioso nível de meta. Bem-vindo ao ápice da contemplação do próprio umbigo — só que desta vez o umbigo se chama **lacorte.dev**, e não um cosplay de CRT verde.

## O Projeto

Este é o meu site pessoal de desenvolvedor. Eu construí ele. Estou escrevendo sobre ele. Nele. Continua meio *A Origem*, mas com menos pião girando e mais ferramentas no navegador.

Eu tratava "portfólio" como código para "um blog com tema escuro." Isso não bastava. LinkedIn e GitHub provam que você existe; um site assim prova que você *entrega*. Então o lacorte.dev é um diário de aprender em público **mais** coisas que as pessoas de fato usam: ferramentas, jogos, feeds de artigos e vagas, e até chat anônimo. Se você veio só pelo post, o resto do menu é opcional. Se veio por um formatador de JSON às 2 da manhã — de nada, internet.

Comece em [`/pt/about`](/pt/about), passe por [`/pt/posts`](/pt/posts), ou vá direto para [`/pt/tools`](/pt/tools) e [`/pt/games`](/pt/games).

## A Stack de Tecnologia (Porque Todo Mundo Se Importa)

### Por Que Não WordPress?

Você deve estar se perguntando: "Por que você simplesmente não usou WordPress como uma pessoa normal?" Bom — eu *uso* WordPress. Para e-commerce, projetos de clientes e todo esse blá-blá-blá. Funciona. Cumpre o papel.

Mas eu não gosto o suficiente dele para estacionar minha marca pessoal lá. WordPress é o colega confiável que entrega rápido e que o RH ama — até o zoológico de plugins e o "ajuste rápido com IA" transformarem o código em espaguete. Para clientes que pedem WordPress? Claro. Dado deles, decisão deles. Para o *meu* site? Quero uma stack que eu explique de ponta a ponta. Quando quebra, sei de quem é a culpa (spoiler: minha).

### Por Que Não Ghost CMS?

O **Ghost** é bonito, limpo e moderno. Também é muita máquina para "Markdown numa pasta." Ótimo se você roda uma empresa de mídia. Para um site pessoal que também hospeda ferramentas e jogos? Exagero. Testei uma vez; o servidor fez barulhos que eu nem sabia que servidor conseguia fazer. O lacorte.dev fica no Next.js — não porque o Ghost seja ruim, mas porque eu quero um app só que faça mais do que um Blogspot com roupa nova.

### Next.js, React, TypeScript

Escolhi o **Next.js** (App Router) porque encaixa de verdade: SSR e SSG onde ajudam, rotas de API e cron para agregadores, e um caminho de deploy que não luta contra mim. Este site roda em **Next.js 16**, **React 19** e **TypeScript** — porque JavaScript sozinho não era confuso o bastante, e discutir com a IDE sobre `string | null` constrói caráter.

### Markdown para os Posts

Os posts ainda vivem como Markdown em `src/content/blog/{en,pt}/`. Sem CMS chique. Escreve no editor, faz commit, faz deploy. É tipo os anos 90 com destaque de sintaxe melhor — e uma pasta por idioma para o português não ser um "depois a gente traduz."

### Supabase, PeerJS e Cia.

O site não é mais só estático. O **Supabase** cuida de Postgres, RLS, auth (incluindo sessões anônimas para favoritos/recentes) e realtime onde importa. O **PeerJS** carrega o tráfego do chat anônimo; a sinalização passa pelo Supabase, não pelo Firebase. Crons na Vercel mantêm feeds de artigos e vagas vivos. Blob opcional existe para assets quando precisamos.

### Tailwind e Alternância de Tema

A UI é **Tailwind** com light/dark por classe — superfícies no tom zinc, primary violeta, Pretendard na tipografia. Sem flicker de terminal. Sem LARP de "invadindo o mainframe." A estética antiga de CRT Fallout foi divertida por um fim de semana; para um site que as pessoas usam como cinto de ferramentas, contraste legível e um toggle de tema ganham.

## Funcionalidades (As Que De Fato Existem)

### UI Pública Bilíngue

Inglês em `/…`, português brasileiro em `/pt/…`. Posts do blog traduzidos onde importa. Admin e login ficam só em inglês — operação não precisa de segundo locale.

### Blog e Comentários

Você está no blog. Posts em Markdown por locale. Comentários passam pelo Supabase nos posts que suportam — não um "quarto de hóspedes" que eu finjo que funciona na Vercel enquanto não funciona.

### Ferramentas e Jogos

Dezenas de ferramentas no navegador (JSON, regex, bcrypt, imagens, timers e amigos) e um monte de jogos pequenos. Fazem parte do produto, não de um rodapé esquecido.

### Artigos e Vagas

Artigos de tech/dev agregados e vagas de TI a partir de páginas de carreira — atualizados sob demanda/agendamento para o site não depender só do meu ritmo de escrita.

### Chat Anônimo

Chat peer-to-peer com sinalização no Supabase. Mora na superfície de ferramentas, sem gritar o tempo todo no menu principal — mas é real.

### Sobre, Contato, Privacidade

Porque um site pessoal sem isso é só uma pasta de vibes. E-mail do jeito antigo quando formulário não é o ponto.

### SEO e Analytics

Sitemaps, `robots.txt`, imagens Open Graph, Vercel Analytics e Speed Insights. O Google vai ligar? Talvez. Eu configurei mesmo assim? Sim.

## Deploy: Vercel

Faço deploy na **Vercel** porque encaixa no Next.js, o plano gratuito basta para um site pessoal, e um push ainda parece mágica — com mais variáveis de ambiente e menos coelhos.

Serverless tem trocas (filesystem efêmero, cold starts, "coloca isso no Blob"). Isso não é pegadinha só da Vercel; é o modelo. Para o lacorte.dev, a troca vale a pena: previews, crons, Analytics e um alias de produção entediantemente confiável em [www.lacorte.dev](https://www.lacorte.dev).

## O Que Eu Aprendi

1. **Não entregue nostalgia como design inteiro** — Verde de terminal era fofo; uma UI light/dark usável é o que as pessoas mantêm aberta.
2. **Markdown ainda é seu amigo** — Conteúdo simples vence. Locales dobram o trabalho, e tudo bem.
3. **TypeScript vai te salvar** — Mesmo quando você odeia ele, está te salvando de você mesmo.
4. **Um "blog" pode ser uma plataforma** — Ferramentas e jogos não são scope creep se são o motivo de voltarem.
5. **i18n é decisão de produto** — `/pt` desde o dia um ganha de "traduzimos depois."
6. **Serverless é um contrato** — Projete para ele em vez de brigar com o filesystem.

## O Balanço da Realidade

O lacorte.dev é over-engineered para "um lugar para escrever"? Provavelmente. Eu poderia ter usado o Medium? Claro. Construir o próprio site ainda é rito de passagem — e agora também é playground para experimentos que eu não quero jogar em cliente.

É perfeito? Não. Vou continuar mexendo? Absolutamente. Algum dia vou ficar satisfeito? Provavelmente não. Esse é o trabalho.

Você pode encontrar o código dessa bagunça [aqui](https://github.com/mateuslacorte/lacorte).
