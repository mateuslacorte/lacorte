---
title: Script CGI de Scanner de Rede
date: '2026-01-05'
tags:
  - portfólio
  - redes
  - bash
  - faculdade
  - retro
description: >-
  Uma relíquia do passado: um script CGI que escrevi na faculdade para
  escanear redes. É velho, é bash, e é provavelmente horrível. Mas ei,
  funcionou!
---


Deixa eu te levar numa viagem no tempo. Bem lá atrás. Tipo, 6 anos atrás. Quando eu era um estudante de redes cara de pau, cheio de sonhos e práticas de programação questionáveis.


Essa é uma história sobre um script CGI que escrevi para uma matéria chamada "Programação Aplicada para Redes de Computadores". Era para ser um scanner de rede simples usando nmap. Simples, né? Bom, eu deixei... interessante.


## O Projeto


A tarefa era direta: criar uma interface web para escaneamento de rede. O professor provavelmente esperava algo simples, talvez um formulário HTML básico que chamasse um script em Python. Mas eu? Fui de bash CGI completo. Porque por que fazer as coisas fáceis quando você pode torná-las desnecessariamente complicadas?


Eu estava estudando Redes de Computadores na época, e já tinha um punhado de certificações de rede no currículo:
- **Mikrotik**: MTCNA, MTCRE, MTCIPv6E, MTCSE
- **Huawei**: HCIA


Então, naturalmente, eu achava que era o máximo. Spoiler: eu não era. Mas eu realmente entendia de redes, o que já é mais do que posso dizer sobre minhas habilidades de bash scripting na época.


## O Código


O script é um único arquivo bash que faz... bem, tudo. É um script CGI que:
1. Checa permissões de diretório (por segurança, eu acho?)
2. Lida com envios de formulário
3. Roda scans de nmap em background
4. Mostra resultados em tempo real com auto-refresh
5. Gerencia I/O de arquivos como se fosse 1995


Está tudo em um arquivo só. Todas as 50+ linhas dele. Porque separação de responsabilidades é para covardes, aparentemente.


O código é velho. Tipo, realmente velho. 6 anos. Em anos de tecnologia, isso é basicamente pré-histórico. Mas sabe de uma coisa? Funcionou. Realmente funcionou. E isso é mais do que posso dizer sobre alguns dos meus projetos mais recentes.


## O Que Ele Faz


O script cria uma interface web onde você pode:
- Digitar um endereço IP (IPv4 ou IPv6, porque eu era chique)
- Rodar um scan de nmap com verbosidade agressiva (`-Av -p-`)
- Ver os resultados atualizarem em tempo real (usando meta refresh, porque JavaScript é para os fracos)
- Ver seus resultados num tema escuro inspirado em terminal


É basicamente um wrapper de nmap baseado na web. Nada chique, mas cumpriu o papel. E sinceramente, para um trabalho de faculdade, isso é tudo que importa.


## O Design: Terminal Chique


Optei por um tema escuro inspirado na estética de terminal. Fundo escuro (#2b2b2b), texto colorido, fonte Orbitron (porque futurista). Era 2019, e eu achava que estava sendo moderno. Olhando para trás, eu só estava sendo... bem, eu mesmo.


A paleta de cores é direto de um terminal retrô:
- Links verdes (#60b48a)
- Spans ciano (#8cd0d3)
- Cabeçalhos laranjas (#dfaf8f)
- Blocos de código roxos (#dc8cc3)


É como se alguém tivesse pegado um terminal e transformado em um site. Que é exatamente o que eu fiz. E sabe de uma coisa? Nem estou arrependido.


## Os Detalhes Técnicos (Ou: Por Que Isso É Terrível)


Sejamos honestos: esse código é uma bagunça. É um único script bash fazendo tudo. Não tem tratamento de erro que valha a pena mencionar. O I/O de arquivos é primitivo. O mecanismo de refresh é gambiarra (meta refresh a cada segundo? Sério?).


Mas aqui está a questão: funcionou. Para um trabalho de faculdade, era isso que importava. O professor provavelmente olhou, viu que funcionava, e me deu uma nota de aprovação. Missão cumprida.


O script usa:
- **Bash CGI** - Porque por que usar frameworks modernos quando você pode usar tecnologia dos anos 90?
- **nmap** - A ferramenta de escaneamento de rede de verdade (a única parte que realmente é boa)
- **Gerenciamento de estado baseado em arquivo** - Porque bancos de dados são superestimados
- **Meta refresh** - Porque atualizações em tempo real são para desenvolvedores JavaScript


É um belo desastre, e eu amo.


## O Que Eu Aprendi


1. **Bash CGI é uma coisa que existe** - E é tão terrível quanto parece
2. **Aplicações de arquivo único são possíveis** - Mas isso não significa que sejam uma boa ideia
3. **Meta refresh funciona** - Mas não é bonito
4. **Permissões de arquivo importam** - Especialmente quando seu script checa elas
5. **Código antigo é constrangedor** - Mas também meio nostálgico


Olhando para esse código agora, eu me encolho todo. Mas também me lembro da empolgação de fazer algo funcionar. A satisfação de ver a saída do nmap aparecer numa página web. O orgulho de entregar algo que realmente funcionava.


Não é um código bom. Mas é *meu* código ruim. E isso já conta para alguma coisa, né?


## O Balanço da Realidade


Esse projeto é velho. Realmente velho. O código é bagunçado. A abordagem é ultrapassada. O design é... bem, é um design. Mas sabe de uma coisa? Aprendi bastante com ele. Aprendi que às vezes fazer algo funcionar é mais importante do que fazer perfeito. Aprendi que bash consegue fazer mais do que você imagina (mesmo que não devesse). Aprendi que trabalhos de faculdade não precisam ser obras-primas — eles só precisam funcionar.


E sinceramente? Essa é uma lição que ainda carrego comigo até hoje. Nem tudo precisa ser perfeito. Às vezes, "funciona" já basta.


Então aí está. Um script CGI em bash de 6 anos que escaneia redes. Não é impressionante. Não é moderno. Nem sequer é tão bom assim. Mas é meu, e eu tenho um orgulho esquisito dele.


Se você quiser ver o código de verdade (e me julgar por causa dele), pode conferir no [GitHub](https://github.com/mmendescortes/aaparc). Aviso justo: é exatamente tão terrível quanto eu descrevi. Mas ei, pelo menos é honesto.
