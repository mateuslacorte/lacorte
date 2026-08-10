---
title: 'Este site (sim, esse que você está lendo agora)'
date: '2026-01-04'
tags:
  - portfólio
  - nextjs
  - vercel
  - meta
description: >-
  Um post meta sobre o lacorte.dev — o site de desenvolvedor bilíngue em que
  você está — e não o antigo blog com cara de terminal Fallout.
---

Então: você está lendo um post… *sobre o site em que está lendo o post*. Meta delicioso. Bem-vindo ao auge da contemplação do próprio umbigo — só que desta vez o umbigo se chama **lacorte.dev**, e não um cosplay de CRT verde.

## O projeto

Este é o meu site pessoal de desenvolvedor. Eu construí. Estou escrevendo sobre ele. Nele. Continua meio *A Origem*, mas com menos pião girando e mais ferramenta no navegador.

Eu tratava "portfólio" como código pra "blog com tema escuro." Não dava. LinkedIn e GitHub provam que você existe; um site assim prova que você *entrega*. Então o lacorte.dev é diário de aprender em público **mais** coisas que as pessoas de fato usam: ferramentas, jogos, feeds de artigos e vagas, e até chat anônimo. Se veio só pelo post, o resto do menu é opcional. Se veio por um formatador de JSON às 2 da manhã — de nada, internet.

Comece em [`/pt/about`](/pt/about), passe por [`/pt/posts`](/pt/posts), ou vá direto em [`/pt/tools`](/pt/tools) e [`/pt/games`](/pt/games).

## A stack (porque todo mundo quer saber)

### Por que não WordPress?

Você deve estar pensando: "Por que você não usou WordPress como gente normal?" Bom — eu *uso* WordPress. E-commerce, cliente, aquele papo todo. Funciona. Cumpre o papel.

Mas não gosto o bastante pra estacionar minha marca pessoal nele. WordPress é o colega confiável que entrega rápido e que o RH ama — até o zoológico de plugins e o "ajuste rápido com IA" transformarem o código em espaguete. Cliente pediu WordPress? Beleza. Dado dele, decisão dele. *Meu* site? Quero uma stack que eu explique de ponta a ponta. Quando quebra, sei de quem é a culpa (spoiler: minha).

### Por que não Ghost CMS?

O **Ghost** é bonito, limpo e moderno. Também é muita máquina pra "Markdown numa pasta." Ótimo se você roda empresa de mídia. Site pessoal que ainda hospeda ferramenta e jogo? Exagero. Testei uma vez; o servidor fez barulho que eu nem sabia que servidor fazia. O lacorte.dev fica no Next.js — não porque o Ghost seja ruim, mas porque eu quero um app só que faça mais do que Blogspot de roupa nova.

### Next.js, React, TypeScript

Escolhi o **Next.js** (App Router) porque encaixa de verdade: SSR e SSG onde ajudam, rotas de API e cron pros agregadores, e um caminho de deploy que não briga comigo. O site roda em **Next.js 16**, **React 19** e **TypeScript** — porque JavaScript sozinho não era confuso o bastante, e discutir com a IDE sobre `string | null` constrói caráter.

### Markdown pros posts

Os posts ainda vivem em Markdown em `src/content/blog/{en,pt}/`. Sem CMS chique. Escreve no editor, commit, deploy. É tipo os anos 90 com syntax highlight melhor — e uma pasta por idioma pra o português não virar "depois a gente traduz."

### Supabase, PeerJS e companhia

O site não é mais só estático. O **Supabase** cuida de Postgres, RLS, auth (incluindo sessão anônima pra favoritos/recentes) e realtime onde importa. O **PeerJS** carrega o tráfego do chat anônimo; a sinalização passa pelo Supabase, não pelo Firebase. Crons na Vercel mantêm feeds de artigos e vagas vivos. Blob opcional existe pra asset quando precisa.

### Tailwind e troca de tema

A UI é **Tailwind** com light/dark por classe — tons de zinc, primary violeta, Pretendard na tipografia. Sem flicker de terminal. Sem LARP de "invadindo o mainframe." A estética antiga de CRT Fallout foi divertida por um fim de semana; pra um site que as pessoas usam como cinto de ferramentas, contraste legível e um toggle de tema ganham.

## Funcionalidades (as que de fato existem)

### UI pública bilíngue

Inglês em `/…`, português brasileiro em `/pt/…`. Posts do blog traduzidos onde importa. Admin e login ficam só em inglês — operação não precisa de segundo locale.

### Blog e comentários

Você está no blog. Posts em Markdown por locale. Comentários passam pelo Supabase nos posts que suportam — não um "quarto de hóspedes" que eu finjo que funciona na Vercel enquanto não funciona.

### Ferramentas e jogos

Dezenas de ferramentas no navegador (JSON, regex, bcrypt, imagens, timers e amigos) e um monte de jogo pequeno. Fazem parte do produto, não de um rodapé esquecido.

### Artigos e vagas

Artigos de tech/dev agregados e vagas de TI a partir de páginas de carreira — atualizados sob demanda/agendamento pra o site não depender só do meu ritmo de escrita.

### Chat anônimo

Chat peer-to-peer com sinalização no Supabase. Mora na área de ferramentas, sem gritar o tempo todo no menu principal — mas é real.

### Sobre, contato, privacidade

Porque site pessoal sem isso é só pasta de vibe. E-mail do jeito antigo quando formulário não é o ponto.

### SEO e analytics

Sitemaps, `robots.txt`, imagens Open Graph, Vercel Analytics e Speed Insights. O Google vai ligar? Talvez. Eu configurei mesmo assim? Sim.

## Deploy: Vercel

Faço deploy na **Vercel** porque encaixa no Next.js, o plano gratuito basta pra site pessoal, e um push ainda parece mágica — com mais variável de ambiente e menos coelho.

Serverless tem trocas (filesystem efêmero, cold start, "coloca isso no Blob"). Isso não é pegadinha só da Vercel; é o modelo. Pro lacorte.dev, a troca vale a pena: preview, cron, Analytics e um alias de produção entediantemente confiável em [www.lacorte.dev](https://www.lacorte.dev).

## O que eu aprendi

1. **Não entregue nostalgia como design inteiro** — Verde de terminal era fofo; UI light/dark usável é o que as pessoas mantêm aberto.
2. **Markdown ainda é seu amigo** — Conteúdo simples vence. Locale dobra o trabalho, e tudo bem.
3. **TypeScript vai te salvar** — Mesmo quando você odeia ele, está te salvando de você mesmo.
4. **Um "blog" pode ser plataforma** — Ferramenta e jogo não são scope creep se são o motivo de voltarem.
5. **i18n é decisão de produto** — `/pt` desde o dia um ganha de "traduzimos depois."
6. **Serverless é um contrato** — Projete pra ele em vez de brigar com o filesystem.

## Pé no chão

O lacorte.dev é over-engineered pra "um lugar pra escrever"? Provavelmente. Eu poderia ter usado o Medium? Claro. Construir o próprio site ainda é rito de passagem — e agora também é playground pra experimento que eu não quero jogar em cliente.

É perfeito? Não. Vou continuar mexendo? Absolutamente. Algum dia vou ficar satisfeito? Provavelmente não. Esse é o trabalho.

O código dessa bagunça está [aqui](https://github.com/mateuslacorte/lacorte).
