---
title: Como selecionar todos os e-mails na interface antiga do Gmail
date: '2026-01-13'
tags:
  - portfólio
  - firefox
  - extensão
  - gmail
  - javascript
description: >-
  Fiz uma extensão pro Firefox pra colocar um botão de 'selecionar todos os
  e-mails' na interface antiga do Gmail. Funcionou. Era simples. E eu acabei
  de arquivar. Clássico.
---


Deixa eu te contar de uma extensão de Firefox que eu fiz. Não porque era revolucionária, não porque resolvia um problema que ia mudar o mundo, mas porque… bem, porque eu precisava dela. E, aparentemente, eu era o único.


## O problema


Então, o Google resolveu atualizar o Gmail. Chocante, eu sei. Interface nova, design moderno, UX **pior**, aquele papo todo. Mas sabe o que eles "esqueceram"? A capacidade de selecionar fácil todos os e-mails na interface antiga quando você precisava fazer ação em massa.


Na verdade, espera. Eles não esqueceram. Só moveram pra outro lugar. Ou talvez tenham removido de vez. Sinceramente não lembro. O que sei é que um dia eu tava tentando selecionar todos os e-mails na interface antiga do Gmail (porque sou criatura de hábito e me recuso a me adaptar a mudança), e não achava o maldito botão.


Então fiz o que qualquer desenvolvedor razoável faria: montei uma extensão de Firefox pra trazer ele de volta. Porque pra que se adaptar à mudança quando você pode escrever código pra evitá-la? Ainda mais quando a mudança é um lixo…


## O projeto


A extensão é… simples. Quase constrangedoramente simples. É literalmente um botão escrito "Selecionar Tudo" que você clica pra marcar todos os e-mails da página atual. É isso. Sem mágica. Sem lógica complexa. Só um botão.


Mas aqui vai o ponto: funcionou. E às vezes, isso já basta.


### O que a extensão faz


A extensão basicamente:

1. Injeta um botão na interface antiga do Gmail
2. Quando você clica, seleciona todos os e-mails da página atual
3. É isso. É a coisa toda.


Eu sei. Revolucionário, né?


A extensão usa um content script que roda nas páginas do Gmail. Acha o container da lista de e-mails, procura todos os checkboxes e… marca eles. Porque é assim que você seleciona coisa no Gmail. Você marca checkbox. Profundo, eu sei.


### Os detalhes técnicos


O código é… bem, é JavaScript. JavaScript puro. Sem framework. Sem dependência. Só manipulação de DOM crua. Do jeito que Deus quis.


Aqui está basicamente o que ele faz:

1. **Espera a página do Gmail carregar** — porque timing é tudo
2. **Acha o container da lista de e-mails** — com o bom e velho `querySelector`
3. **Adiciona um botão na interface** — porque por que não?
4. **Escuta clique** — porque botão precisa fazer alguma coisa
5. **Acha todos os checkboxes** — os que selecionam e-mail individual
6. **Marca todos** — porque esse é o objetivo


O código usa manipulação de DOM pra injetar o botão na interface do Gmail. Procura classes CSS e IDs específicos que o Gmail usa (o que é sempre arriscado porque podem mudar, mas ei, funcionou quando eu fiz… Spoiler: não funciona mais!).


O botão é estilizado pra parecer que pertence à interface do Gmail. Não é perfeito, mas é bom o bastante. Porque perfeição é superestimada. Ou pelo menos é isso que eu falo pra mim mesmo.


### A extensão de Firefox


A extensão é montada com a WebExtensions API, o padrão de extensão do Firefox. Tem:

- Um arquivo `manifest.json` — porque toda extensão precisa de um
- Um content script — o JavaScript que roda nas páginas do Gmail
- Ícones — porque extensão precisa de ícone (eu acho?)
- Um README — porque documentação importa, mesmo pra coisa simples


O manifesto diz que a extensão deve rodar nas páginas do Gmail (`*://mail.google.com/*`). Quando você abre o Gmail, o content script carrega, acha o lugar certo pra injetar o botão, e faz o que tem que fazer.


### Por que a interface antiga do Gmail?


Você deve estar pensando: "Por que a interface antiga? Por que não a nova?"


Boa pergunta. Resposta honesta: porque era o que eu usava na época. E quando eu não conseguia selecionar fácil todos os e-mails, fiquei puto. Então resolvi.


### O arquivamento


Acabei de arquivar o repositório. 4 de janeiro de 2026. Arquivamento fresquinho, ainda quente.


Por quê? Porque o Gmail mudou. De novo. Provavelmente estão matando a interface antiga de vez. Ou talvez tenham corrigido o problema. Ou talvez eu simplesmente tenha parado de usar a interface antiga. Sinceramente acho que é uma mistura de tudo isso…


Mas a extensão ainda tá lá. Só está… arquivada. Feito fóssil digital. Um lembrete de uma época em que eu me importava o bastante com selecionar todos os e-mails a ponto de escrever uma extensão de Firefox pra isso.


## O que eu aprendi

1. **Problema simples pede solução simples** — às vezes um botão é só um botão
2. **Extensão de navegador é mais fácil do que parece** — a WebExtensions API é bem direta
3. **O Google muda as coisas o tempo todo** — escrever extensão pra serviço do Google é luta perdida
4. **Às vezes você é o único usuário** — e tudo bem
5. **Arquivar projeto alivia** — às vezes você só precisa largar a mão


## O código


Está arquivado, mas ainda tá lá. Pode olhar. Me julgar. Instalar se quiser. Não me importo. Está arquivado. Não é mais problema meu.


O código é simples. É JavaScript. Manipula o DOM. Costumava funcionar… E isso basta.


## Pé no chão


Essa extensão não impressiona. Não é complexa. Nem sequer é tão útil assim. Mas resolveu um problema que eu tinha, na época em que eu tinha. E às vezes, isso já basta.


É um projeto pequeno. Simples. Um projeto em que eu provavelmente passei mais tempo pensando do que realmente escrevendo. Mas é meu. E estou escrevendo sobre ele. Então aqui estamos.


A extensão funcionou. Fez o que era pra fazer. E depois eu arquivei porque… bem, por motivos. Comportamento clássico de desenvolvedor.


Se você ainda usa a interface antiga do Gmail e precisa selecionar todos os e-mails, essa extensão pode ajudar. Ou pode não ajudar. Está arquivada, então não faço promessa. Mas ei, está lá se você quiser.


---


A extensão está no [GitHub](https://github.com/mateuslacorte/select-all-e-mails-on-old-gmail-interface) se você realmente quiser ver. Está arquivada, então não espere update. Mas se você precisa selecionar todos os e-mails na interface antiga do Gmail, usa Firefox, e está se sentindo aventureiro… manda ver. Não vou te impedir.
