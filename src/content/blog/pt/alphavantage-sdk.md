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
  Um pacote NPM de 7 anos que eu montei pra encapsular a API da Alpha Vantage.
  É simples, é velho, e ainda tá no NPM. Não me julgue.
---


Deixa eu te contar da época em que eu achava que era desenvolvedor de verdade. Foi há 7 anos. Eu era jovem, ingênuo, e cheio de… bem, principalmente cafeína e decisão de vida questionável.


Criei um pacote NPM. De verdade. Publiquei e tudo. Se chama `alphavantage-sdk`, e ainda tá por aí, assombrando o registro do NPM feito fantasma digital do meu passado.


## O projeto


Eu queria usar a API da Alpha Vantage (dados de mercado de ações de graça — porque quem não ama API gratuita?). Mas fazer request HTTP era difícil, aparentemente. Então fiz o que qualquer desenvolvedor razoável faria: encapsulei numa lib e publiquei no NPM.


Porque por que usar `fetch` ou `axios` direto quando você pode meter uma camada a mais de abstração? É isso que os bons fazem, né? Né?


O pacote é simples. Quase constrangedoramente simples. Basicamente um wrapper em cima do módulo `https` nativo do Node.js. Mas ei, funcionou. E as pessoas realmente usaram. Algumas ainda usam, provavelmente. Deus as ajude.


## O código


O SDK inteiro tem… espera só… umas 50 linhas. Só isso. 50 linhas. Pra um pacote NPM inteiro. Não tenho orgulho, mas também não tenho vergonha. É um meio-termo esquisito.


O código faz exatamente o que você espera:
1. Recebe uma chave de API
2. Faz request HTTP pra Alpha Vantage
3. Devolve JSON já parseado
4. É isso. É a coisa toda.


Usei o módulo `https` nativo do Node.js porque eu era preguiçoso demais pra adicionar dependência. O que, olhando pra trás, foi na verdade uma jogada inteligente. Menos dependência = menos dor de cabeça. Quem diria?


O código usa Promise (porque async/await ainda não era moda em 2018, ou eu simplesmente não sabia que existia). Ele concatena na mão os pedaços da resposta porque… bem, porque era assim que se fazia naquela época, eu acho?


## O que ele faz


O SDK expõe funções pra buscar dado de mercado:
- Séries temporais diárias, semanais e mensais
- Versões ajustadas e não ajustadas
- Conjuntos completos (porque às vezes você precisa de TODOS os dados)


É basicamente um wrapper fininho que:
1. Recebe um símbolo de ação (tipo `'MSFT'` pra Microsoft)
2. Chama a API da Alpha Vantage
3. Devolve os dados


É isso. Sem mágica. Sem lógica complexa. Só request HTTP embrulhada em função. E sabe de uma coisa? Às vezes isso já basta.


## O pacote NPM


Eu publiquei no NPM. As pessoas instalaram. Algumas talvez ainda estejam usando. Sinto muito, futuros desenvolvedores que precisam manter código que depende disso.


O nome do pacote é `alphavantage-sdk`. Ainda tá lá. Você pode instalar agora mesmo com `npm install alphavantage-sdk`. Por favor, não instale. Mas você poderia.


Tem README. Tem exemplo. Até tem um `CONTRIBUTING.md` (porque eu era chique). Licença MPL 2.0, porque eu achei que era boa ideia na época. Ainda acho que é, na verdade.


## Os detalhes técnicos


Sejamos honestos: esse código não impressiona. É um wrapper HTTP simples. Qualquer um escreve isso em 10 minutos. Eu provavelmente escrevi em 10 minutos. Mas eu publiquei, e é isso que conta, né?


O código usa:
- **Módulo `https` do Node.js** — porque dependência é pra fraco
- **Promises** — porque async/await era novidade demais
- **Concatenação manual de chunks** — porque eu não conhecia jeito melhor
- **Chave de API global** — porque configuração é difícil


Não é código bom. Mas é código que funciona. E às vezes, pra um pacote NPM, isso já basta.


## O que eu aprendi


1. **Publicar no NPM é fácil** — talvez fácil demais
2. **Solução simples funciona** — mesmo sem elegância
3. **As pessoas vão usar seu código** — mesmo que seja uma porcaria
4. **Documentação importa** — mesmo pra pacote de 50 linhas
5. **Código antigo é constrangedor** — mas também meio nostálgico


Olhando esse código agora, vejo tudo que eu faria diferente:
- Usar async/await
- Meter tratamento de erro de verdade
- Usar uma lib HTTP de verdade
- Adicionar tipos TypeScript
- De fato testar o código


Mas sabe de uma coisa? Funcionou. As pessoas usaram. E isso é mais do que posso dizer de alguns projetos mais "polidos" que nunca viram a luz do dia.


## Pé no chão


Esse pacote é velho. Velho de verdade. 7 anos. Em anos de JavaScript, isso é pré-história. O código é simples. A abordagem é ultrapassada. A implementação é… bem, é uma implementação.


Mas aqui vai o ponto: eu entreguei. Eu publiquei. As pessoas usaram. E isso já é alguma coisa. Nem todo mundo pode dizer que publicou um pacote NPM, mesmo que seja só um wrapper simples.


Não impressiona. Não é complexo. Nem sequer é tão bom assim. Mas é meu, e eu tenho um orgulho esquisito dele. Mesmo que também fique um pouco constrangido por causa dele.


Se quiser ver o código de verdade (e me julgar por causa dele), confere no [GitHub](https://github.com/mmendescortes/alphavantage-node-sdk). Ou instala pelo NPM se estiver se sentindo aventureiro. Só não me conta se fizer isso. Eu não quero saber.
