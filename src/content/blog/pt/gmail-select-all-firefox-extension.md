---
title: Como Selecionar Todos os E-mails na Interface Antiga do Gmail
date: '2026-01-13'
tags:
  - portfólio
  - firefox
  - extensão
  - gmail
  - javascript
description: >-
  Criei uma extensão para Firefox para adicionar um botão de 'selecionar todos
  os e-mails' na interface antiga do Gmail. Funcionou. Era simples. E eu acabei
  de arquivar. Clássico.
---


Deixa eu te contar sobre uma extensão de Firefox que eu criei. Não porque era revolucionária, não porque resolvia um problema que mudaria o mundo, mas porque... bem, porque eu precisava dela. E aparentemente, eu era o único.


## O Problema


Então, o Google decidiu atualizar o Gmail. Chocante, eu sei. Criaram uma interface nova com design moderno, UX **pior**, todo esse blá-blá-blá. Mas sabe o que eles esqueceram? A capacidade de selecionar facilmente todos os e-mails na interface antiga quando você precisava fazer ações em massa.


Na verdade, espera. Eles não esqueceram. Só moveram para outro lugar. Ou talvez tenham removido completamente. Sinceramente não me lembro. Tudo que sei é que um dia eu estava tentando selecionar todos os meus e-mails na interface antiga do Gmail (porque sou uma criatura de hábitos e me recuso a me adaptar a mudanças), e não conseguia achar o maldito botão.


Então fiz o que qualquer desenvolvedor razoável faria: criei uma extensão de Firefox para trazer ele de volta. Porque para que se adaptar à mudança quando você pode escrever código para evitá-la? Ainda mais quando a mudança é um lixo...


## O Projeto


A extensão é... simples. Quase constrangedoramente simples. É literalmente só um botão que diz "Selecionar Tudo" que você pode clicar para selecionar todos os e-mails na página atual. É isso. Sem mágica. Sem lógica complexa. Só um botão.


Mas aqui está a questão: funcionou. E às vezes, isso já basta.


### O Que a Extensão Faz


A extensão basicamente:

1. Injeta um botão na interface antiga do Gmail
2. Quando você clica nele, seleciona todos os e-mails na página atual
3. É isso. É a coisa toda.


Eu sei. Revolucionário, né?


A extensão usa um content script que roda nas páginas do Gmail. Ele encontra o container da lista de e-mails, procura por todos os checkboxes, e... marca eles. Porque é assim que você seleciona coisas no Gmail. Você marca os checkboxes. Profundo, eu sei.


### Os Detalhes Técnicos


O código é... bem, é JavaScript. JavaScript puro. Sem frameworks. Sem dependências. Só manipulação de DOM pura e sem adulteração. Do jeito que Deus quis.


Aqui está basicamente o que ele faz:

1. **Espera a página do Gmail carregar** - Porque timing é tudo
2. **Encontra o container da lista de e-mails** - Usando o bom e velho `querySelector`
3. **Adiciona um botão à interface** - Porque por que não?
4. **Escuta cliques** - Porque botões precisam fazer alguma coisa
5. **Encontra todos os checkboxes** - Os checkboxes que selecionam e-mails individuais
6. **Marca todos eles** - Porque é esse o objetivo


O código usa manipulação de DOM para injetar o botão na interface do Gmail. Ele procura por classes CSS e IDs específicos que o Gmail usa (o que é sempre arriscado porque podem mudar, mas ei, funcionou quando eu fiz... Spoiler: não funciona mais!).


O botão é estilizado para parecer que pertence à interface do Gmail. Não é perfeito, mas é bom o suficiente. Porque perfeição é superestimada. Ou pelo menos é isso que eu digo para mim mesmo.


### A Extensão de Firefox


A extensão é construída usando a WebExtensions API, que é o padrão para extensões de Firefox. Ela tem:

- Um arquivo `manifest.json` - Porque toda extensão precisa de um
- Um content script - O JavaScript que roda nas páginas do Gmail
- Ícones - Porque extensões precisam de ícones (eu acho?)
- Um README - Porque documentação é importante, mesmo para coisas simples


O manifesto especifica que a extensão deve rodar nas páginas do Gmail (`*://mail.google.com/*`). Quando você visita o Gmail, o content script carrega, encontra o lugar certo para injetar o botão, e faz o que tem que fazer.


### Por Que a Interface Antiga do Gmail?


Você deve estar se perguntando: "Por que a interface antiga do Gmail? Por que não a nova?"


Boa pergunta. Aqui está a resposta honesta: porque era o que eu estava usando na época. E quando eu não conseguia selecionar facilmente todos os meus e-mails, fiquei frustrado. Então resolvi.


### O Arquivamento


Acabei de arquivar o repositório. 4 de janeiro de 2026. Arquivamento fresquinho, ainda quente do forno.


Por quê? Porque o Gmail mudou. De novo. Provavelmente estão descontinuando a interface antiga por completo. Ou talvez tenham corrigido o problema. Ou talvez eu simplesmente tenha parado de usar a interface antiga. Sinceramente acho que é uma combinação de todas essas opções...


Mas a extensão ainda está lá. Só está... arquivada. Feito um fóssil digital. Um lembrete de uma época em que eu me importava o suficiente com selecionar todos os meus e-mails a ponto de escrever uma extensão de Firefox para isso.


## O Que Eu Aprendi

1. **Problemas simples precisam de soluções simples** - Às vezes um botão é só um botão
2. **Extensões de navegador são mais fáceis do que você pensa** - A WebExtensions API é na verdade bem direta
3. **O Google muda as coisas o tempo todo** - Escrever extensões para serviços do Google é uma batalha perdida
4. **Às vezes você é o único usuário** - E tudo bem
5. **Arquivar projetos é catártico** - Às vezes você só precisa deixar as coisas irem


## O Código


Está arquivado, mas ainda está lá. Você pode olhar. Me julgar por causa dele. Instalar se quiser. Não me importo. Está arquivado. Não é mais problema meu.


O código é simples. É JavaScript. Manipula o DOM. Costumava funcionar... E isso basta.


## O Balanço da Realidade


Essa extensão não é impressionante. Não é complexa. Nem sequer é tão útil assim. Mas resolveu um problema que eu tinha, na época em que eu tinha. E às vezes, isso já basta.


É um projeto pequeno. Um projeto simples. Um projeto no qual eu provavelmente passei mais tempo pensando do que realmente escrevendo. Mas é meu. E estou escrevendo sobre ele. Então aqui estamos.


A extensão funcionou. Fez o que era para fazer. E depois eu arquivei porque... bem, por motivos. Comportamento clássico de desenvolvedor.


Se você ainda está usando a interface antiga do Gmail e precisa selecionar todos os seus e-mails, essa extensão pode ajudar. Ou pode não ajudar. Está arquivada, então não faço promessas. Mas ei, está lá se você quiser.


---


A extensão está disponível no [GitHub](https://github.com/mateuslacorte/select-all-e-mails-on-old-gmail-interface) se você realmente quiser ver. Está arquivada, então não espere atualizações. Mas se você precisa selecionar todos os seus e-mails na interface antiga do Gmail, e está usando Firefox, e está se sentindo aventureiro... vá em frente. Não vou te impedir.
