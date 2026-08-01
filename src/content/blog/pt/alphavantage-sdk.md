---
title: Alpha Vantage SDK para Node.js
date: '2026-01-05'
tags:
  - portfólio
  - nodejs
  - npm
  - api
  - retro
description: >-
  Um pacote NPM de 7 anos que criei para encapsular a API da Alpha Vantage. É
  simples, é velho, e ainda está no NPM. Não me julgue.
---


Deixa eu te contar sobre a época em que eu achei que era um desenvolvedor de verdade. Foi há 7 anos. Eu era jovem, ingênuo, e cheio de... bem, principalmente cafeína e decisões de vida questionáveis.


Criei um pacote NPM. Um de verdade. Publiquei e tudo. Se chama `alphavantage-sdk`, e ainda está por aí, assombrando o registro do NPM feito um fantasma digital do meu passado.


## O Projeto


Eu queria usar a API da Alpha Vantage (que fornece dados de mercado de ações de graça, porque quem não ama uma API gratuita?). Mas fazer requisições HTTP era difícil, aparentemente. Então fiz o que qualquer desenvolvedor razoável faria: encapsulei numa biblioteca e publiquei no NPM.


Porque por que usar `fetch` ou `axios` diretamente quando você pode adicionar uma camada extra de abstração? É isso que os bons desenvolvedores fazem, né? Né?


O pacote é simples. Quase constrangedoramente simples. É basicamente um wrapper em cima do módulo `https` nativo do Node.js. Mas ei, funcionou. E as pessoas realmente usaram. Algumas ainda usam, provavelmente. Deus as ajude.


## O Código


O SDK inteiro tem... espera só... umas 50 linhas de código. Só isso. 50 linhas. Para um pacote NPM inteiro. Não tenho orgulho, mas também não tenho vergonha. É um meio-termo esquisito.


O código faz exatamente o que você esperaria:
1. Recebe uma chave de API
2. Faz requisições HTTP para a Alpha Vantage
3. Retorna JSON já parseado
4. É isso. É a coisa toda.


Usei o módulo `https` nativo do Node.js porque eu era preguiçoso demais para adicionar uma dependência. O que, olhando para trás, foi na verdade uma jogada inteligente. Menos dependências = menos problemas. Quem diria?


O código usa Promises (porque async/await ainda não era moda em 2018, ou eu simplesmente não sabia da existência). Ele concatena manualmente os pedaços de resposta porque... bem, porque era assim que se fazia naquela época, eu acho?


## O Que Ele Faz


O SDK fornece funções para buscar dados de mercado de ações:
- Séries temporais diárias, semanais e mensais
- Versões ajustadas e não ajustadas
- Conjuntos de dados completos (porque às vezes você precisa de TODOS os dados)


É basicamente um wrapper fininho que:
1. Recebe um símbolo de ação (tipo 'MSFT' para a Microsoft)
2. Chama a API da Alpha Vantage
3. Retorna os dados


É isso. Sem mágica. Sem lógica complexa. Só requisições HTTP encapsuladas em funções. E sabe de uma coisa? Às vezes isso já basta.


## O Pacote NPM


Eu publiquei no NPM. As pessoas instalaram. Algumas talvez ainda estejam usando. Sinto muito, futuros desenvolvedores que precisam manter código que depende disso.


O nome do pacote é `alphavantage-sdk`. Ainda está lá. Você pode instalar agora mesmo com `npm install alphavantage-sdk`. Por favor, não instale. Mas você poderia.


Ele tem um README. Tem exemplos. Até tem um arquivo CONTRIBUTING.md (porque eu era chique). É licenciado sob MPL 2.0, porque eu achei que era uma boa ideia na época. Ainda acho que é, na verdade.


## Os Detalhes Técnicos


Sejamos honestos: esse código não é impressionante. É um wrapper HTTP simples. Qualquer um conseguiria escrever isso em 10 minutos. Eu provavelmente escrevi em 10 minutos. Mas eu publiquei, e é isso que conta, né?


O código usa:
- **Módulo `https` do Node.js** - Porque dependências são para os fracos
- **Promises** - Porque async/await era coisa nova demais
- **Concatenação manual de chunks** - Porque eu não conhecia formas melhores
- **Chave de API global** - Porque configuração é difícil


Não é um código bom. Mas é um código funcional. E às vezes, isso já basta para um pacote NPM.


## O Que Eu Aprendi


1. **Publicar no NPM é fácil** - Talvez fácil demais
2. **Soluções simples funcionam** - Mesmo que não sejam elegantes
3. **As pessoas vão usar seu código** - Mesmo que seja terrível
4. **Documentação importa** - Mesmo para pacotes de 50 linhas
5. **Código antigo é constrangedor** - Mas também meio nostálgico


Olhando para esse código agora, vejo todas as coisas que eu faria diferente:
- Usar async/await
- Adicionar tratamento de erro de verdade
- Usar uma biblioteca HTTP de verdade
- Adicionar tipos TypeScript
- Realmente testar o código


Mas sabe de uma coisa? Funcionou. As pessoas usaram. E isso é mais do que posso dizer sobre alguns dos meus projetos mais "polidos" que nunca viram a luz do dia.


## O Balanço da Realidade


Esse pacote é velho. Realmente velho. 7 anos. Em anos de JavaScript, isso é basicamente história antiga. O código é simples. A abordagem é ultrapassada. A implementação é... bem, é uma implementação.


Mas aqui está a questão: eu entreguei. Eu publiquei. As pessoas usaram. E isso já é alguma coisa. Nem todo mundo pode dizer que publicou um pacote NPM, mesmo que seja só um wrapper simples.


Não é impressionante. Não é complexo. Nem sequer é tão bom assim. Mas é meu, e eu tenho um orgulho esquisito dele. Mesmo que também esteja um pouco constrangido por causa dele.


Se você quiser ver o código de verdade (e me julgar por causa dele), pode conferir no [GitHub](https://github.com/mmendescortes/alphavantage-node-sdk). Ou instalar pelo NPM se estiver se sentindo aventureiro. Só não me conte se você fizer isso. Não quero saber.
