---
title: Script CGI de scanner de rede
date: '2026-01-05'
tags:
  - portfólio
  - redes
  - bash
  - faculdade
  - retro
description: >-
  Uma relíquia do passado: um script CGI que escrevi na faculdade pra
  escanear redes. É velho, é bash, e provavelmente é horrível. Mas ei,
  funcionou!
---


Deixa eu te levar numa viagem no tempo. Bem lá atrás. Tipo, 6 anos atrás. Quando eu era estudante de redes metido a besta, cheio de sonho e prática de programação questionável.


Essa é a história de um script CGI que escrevi pra uma matéria chamada "Programação Aplicada para Redes de Computadores". Era pra ser um scanner de rede simples usando nmap. Simples, né? Bom, eu deixei… interessante.


## O projeto


A tarefa era direta: criar uma interface web pra escaneamento de rede. O professor provavelmente esperava algo simples, talvez um formulário HTML básico que chamasse um script em Python. Eu? Fui de bash CGI completo. Porque por que fazer fácil quando dá pra complicar sem necessidade?


Eu estava em Redes de Computadores na época, e já tinha um punhado de certificação de rede no currículo:
- **Mikrotik**: MTCNA, MTCRE, MTCIPv6E, MTCSE
- **Huawei**: HCIA


Então, naturalmente, eu achava que era o máximo. Spoiler: não era. Mas eu realmente entendia de redes, o que já é mais do que posso dizer das minhas habilidades de bash scripting na época.


## O código


O script é um único arquivo bash que faz… bem, tudo. É um script CGI que:
1. Checa permissão de diretório (por segurança, eu acho?)
2. Lida com envio de formulário
3. Roda scan de nmap em background
4. Mostra resultado em tempo real com auto-refresh
5. Gerencia I/O de arquivo como se fosse 1995


Tudo num arquivo só. Todas as 50+ linhas dele. Porque separação de responsabilidades é pra covarde, aparentemente.


O código é velho. Tipo, velho de verdade. 6 anos. Em anos de tecnologia, isso é pré-história. Mas sabe de uma coisa? Funcionou. De verdade. E isso é mais do que posso dizer de alguns projetos mais recentes.


## O que ele faz


O script monta uma interface web onde você pode:
- Digitar um endereço IP (IPv4 ou IPv6, porque eu era chique)
- Rodar um scan de nmap com verbosidade agressiva (`-Av -p-`)
- Ver o resultado atualizar em tempo real (usando meta refresh, porque JavaScript é pra fraco)
- Ver o resultado num tema escuro inspirado em terminal


É basicamente um wrapper de nmap baseado na web. Nada chique, mas cumpriu o papel. E sinceramente, pra trabalho de faculdade, é isso que importa.


## O design: terminal chique


Optei por um tema escuro inspirado na estética de terminal. Fundo escuro (#2b2b2b), texto colorido, fonte Orbitron (porque futurista). Era 2019, e eu achava que estava sendo moderno. Olhando pra trás, eu só estava sendo… bem, eu mesmo.


A paleta é direto de um terminal retrô:
- Links verdes (#60b48a)
- Spans ciano (#8cd0d3)
- Cabeçalhos laranjas (#dfaf8f)
- Blocos de código roxos (#dc8cc3)


É como se alguém tivesse pegado um terminal e virado site. Que é exatamente o que eu fiz. E sabe de uma coisa? Nem tô arrependido.


## Os detalhes técnicos (ou: por que isso é terrível)


Sejamos honestos: esse código é uma bagunça. Um único script bash fazendo tudo. Não tem tratamento de erro que preste. O I/O de arquivo é primitivo. O mecanismo de refresh é gambiarra (meta refresh a cada segundo? Sério?).


Mas aqui vai o ponto: funcionou. Pra trabalho de faculdade, era isso que importava. O professor provavelmente olhou, viu que rodava, e me deu nota de aprovação. Missão cumprida.


O script usa:
- **Bash CGI** — porque por que usar framework moderno quando dá pra usar tecnologia dos anos 90?
- **nmap** — a ferramenta de escaneamento de verdade (a única parte que realmente é boa)
- **Estado em arquivo** — porque banco de dados é superestimado
- **Meta refresh** — porque update em tempo real é pra desenvolvedor JavaScript


É um belo desastre, e eu amo.


## O que eu aprendi


1. **Bash CGI existe** — e é tão terrível quanto parece
2. **App de arquivo único é possível** — mas isso não quer dizer que seja boa ideia
3. **Meta refresh funciona** — mas não é bonito
4. **Permissão de arquivo importa** — especialmente quando seu script checa elas
5. **Código antigo é constrangedor** — mas também meio nostálgico


Olhando esse código agora, eu me encolho todo. Mas também lembro da empolgação de fazer algo funcionar. A satisfação de ver a saída do nmap aparecer numa página web. O orgulho de entregar algo que de fato rodava.


Não é código bom. Mas é *meu* código ruim. E isso já conta pra alguma coisa, né?


## Pé no chão


Esse projeto é velho. Velho de verdade. O código é bagunçado. A abordagem é ultrapassada. O design é… bem, é um design. Mas sabe de uma coisa? Aprendi bastante com ele. Aprendi que às vezes fazer funcionar importa mais do que fazer perfeito. Aprendi que bash consegue fazer mais do que você imagina (mesmo que não devesse). Aprendi que trabalho de faculdade não precisa ser obra-prima — só precisa funcionar.


E sinceramente? Essa lição eu ainda carrego. Nem tudo precisa ser perfeito. Às vezes, "funciona" já basta.


Então aí está. Um script CGI em bash de 6 anos que escaneia rede. Não impressiona. Não é moderno. Nem sequer é tão bom assim. Mas é meu, e eu tenho um orgulho esquisito dele.


Se quiser ver o código de verdade (e me julgar por causa dele), confere no [GitHub](https://github.com/mmendescortes/aaparc). Aviso justo: é exatamente tão terrível quanto eu descrevi. Mas ei, pelo menos é honesto.
