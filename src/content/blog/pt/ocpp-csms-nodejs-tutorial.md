---
title: 'Montando um CSMS OCPP em Node.js: do zero até a estação responder'
date: '2026-08-10'
tags:
  - ocpp
  - carregamento-ev
  - nodejs
  - websocket
  - typescript
  - tutorial
description: >-
  Guia prático de OCPP para quem programa em Node. Como carregadores falam com
  um Sistema Central, como funciona o framing JSON sobre WebSocket e como
  evoluir um CSMS mínimo do BootNotification até sessões de verdade.
---


Se você já mexeu com software de carregamento de carro elétrico, provavelmente esbarrou na sigla **OCPP**. É o Open Charge Point Protocol — a língua que a maior parte dos carregadores públicos usa para falar com o backend. Esse backend costuma se chamar **CSMS** (Charging Station Management System; em docs mais antigos aparece como “Central System”).


Este post é para quem desenvolve em Node.js e quer subir um CSMS, ou está pesquisando como o OCPP se encaixa antes de fechar a stack. Vamos ficar perto do protocolo: o que conecta, como as mensagens se parecem, quais actions importam primeiro e como sair de “estação online” para “sessão começou e terminou”. Os exemplos usam uma biblioteca Node pequena que implementa OCPP-J (JSON sobre WebSocket) nas versões 1.6, 2.0.1 e 2.1. A biblioteca é o cano; este guia é o mapa.


## O que você está construindo de verdade


Um CSMS não é uma API REST com uns endpoints de carga. As estações abrem um **WebSocket de longa duração**, negociam a versão do protocolo e trocam **mensagens no estilo RPC**. Seu servidor aceita essas conexões, valida os payloads contra os schemas oficiais, responde às chamadas que a estação inicia e, de vez em quando, inicia as próprias (start remoto, reset, unlock do conector, etc.).


Pense em três camadas:


1. **Transporte** — upgrade WebSocket, negociação de subprotocolo, identidade da conexão.
2. **Framing** — CALL, CALLRESULT, CALLERROR como arrays JSON.
3. **Domínio** — quem pode carregar, IDs de transação, dados de medidor, tarifas, smart charging.


Uma boa biblioteca OCPP resolve (1) e (2). Você resolve (3). Essa divisão é o ponto: você não deveria reimplementar framing toda vez que muda a regra de faturamento.


## Atores e vocabulário


No primeiro dia, dois papéis importam:


- **Charging Station** (antes *Charge Point*) — o hardware ou o simulador no site.
- **CSMS** — o processo Node que aceita `ws://…/ocpp/:chargePointId` (ou `wss://` em produção).


A identidade em geral vai no path da URL. Uma estação conecta assim:


```text
wss://csms.example.com/ocpp/CP_001
```


O `CP_001` é o id que o registry vai usar como chave. A **versão OCPP não fica no path**. Ela chega como oferta de subprotocolo WebSocket no `Sec-WebSocket-Protocol`:


| Cliente oferece | Versão negociada |
|-----------------|------------------|
| `ocpp1.6` | OCPP 1.6 |
| `ocpp2.0.1` | OCPP 2.0.1 |
| `ocpp2.1` | OCPP 2.1 |


Um path só para todas as estações, uma lista de preferência no servidor, e a negociação escolhe o melhor acordo. Se não houver match, o upgrade deve falhar. Assim uma frota mista — equipamentos 1.6 antigos e firmware 2.x novo — pode bater no mesmo endpoint.


Este tutorial cobre **só OCPP-J** (JSON sobre WebSocket). O SOAP 1.6 clássico ainda existe por aí, mas CSMS moderno em Node quase sempre significa OCPP-J.


## O envelope da mensagem


Esqueça verbos REST por um instante. Toda mensagem OCPP-J é um **array** JSON:


| Tipo | Forma |
|------|--------|
| CALL | `[2, uniqueId, action, payload]` |
| CALLRESULT | `[3, uniqueId, payload]` |
| CALLERROR | `[4, uniqueId, errorCode, errorDescription, errorDetails]` |


O `uniqueId` amarra pedido com resultado ou erro. `action` é uma string tipo `BootNotification` ou `Authorize`. `payload` é um objeto JSON cujos campos vêm dos schemas da Open Charge Alliance para aquela versão.


Uma estação que acabou de ligar pode mandar:


```json
[2, "boot-1", "BootNotification", {
  "chargePointVendor": "Acme",
  "chargePointModel": "Wallbox-7"
}]
```


Esse formato de payload é OCPP **1.6**. Em 2.0.1 / 2.1 a mesma action usa um objeto `chargingStation` aninhado e um campo `reason`. Quando o contrato muda, o handler precisa olhar a versão negociada — mesmo nome de action, payloads diferentes.


O CSMS responde com um CALLRESULT reusando o mesmo `uniqueId`:


```json
[3, "boot-1", {
  "status": "Accepted",
  "currentTime": "2026-08-10T12:00:00.000Z",
  "interval": 300
}]
```


O `interval` diz de quantos em quantos segundos a estação deve mandar Heartbeat. Aceitar o boot é o jeito de colocar a estação na lista de “online e sob gestão”.


## Instalação e um servidor mínimo


Você precisa de Node 18+. Instale o pacote CSMS OCPP no npm:


```bash
npm install fastify-ocpp
```


Registre a camada OCPP no servidor com as versões que você quer aceitar. Preferir a mais nova primeiro costuma ser um bom default:


```ts
import { fastifyOcpp } from 'fastify-ocpp';

await app.register(fastifyOcpp, {
  versions: ['2.1', '2.0.1', '1.6'],
  path: '/ocpp',
});
```


Depois do register você ganha a superfície `ocpp`: handlers de entrada, calls de saída e o registry de conexões. Configuração que vale conhecer cedo:


- **`versions`** — allow-list e ordem de preferência na negociação.
- **`path`** — prefixo compartilhado; o `/:chargePointId` é acrescentado sozinho.
- **`validateIncoming` / `validateOutgoing`** — validação contra schemas JSON da OCA (ligada por padrão).
- **`callTimeoutMs`** — quanto tempo a CALL de saída espera resposta.
- **`rejectDuplicateConnections`** — se um segundo socket pro mesmo id é rejeitado.
- **`onConnect` / `onDisconnect`** — hooks pra log, métrica ou presença.


Validação de schema não é detalhe cosmético. Estação e CSMS discordam de jeitos sutis; rejeitar payload ruim com CALLERROR é o que te mantém interoperável em vez de caçar silêncio estranho três semanas depois.


## Primeiros handlers: Boot e Heartbeat


Toda relação saudável com uma estação começa com BootNotification e um ritmo de heartbeat. Registre isso antes de inventar billing:


```ts
app.ocpp.onAction('BootNotification', async (payload, ctx) => {
  // Persista vendor/model (ou chargingStation) com chave ctx.chargePointId
  console.log('boot', ctx.chargePointId, ctx.version, payload);

  return {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300,
  };
});
```


O handler recebe o payload decodificado e um contexto com `chargePointId`, `version`, `uniqueId`, `action` e o socket. Devolva um objeto simples; a biblioteca empacota como CALLRESULT e valida.


Heartbeat é ainda menor — a estação pinga pra você saber que o link está vivo:


```ts
app.ocpp.onAction('Heartbeat', async () => ({
  currentTime: new Date().toISOString(),
}));
```


Suba o processo e aponte um simulador (ou uma estação de verdade) pra `ws://localhost:9000/ocpp/CP_001` com o subprotocolo certo. Quando o BootNotification chegar e os Heartbeats seguirem no intervalo, o transporte está ok. Comemore baixo e aí sim mete lógica de domínio.


## Status e presença


As estações reportam o estado do conector com `StatusNotification` (Available, Preparing, Charging, Faulted e companhia). Ainda não precisa de regra de negócio profunda — guarde o último status por conector e mostre numa UI de operação:


```ts
app.ocpp.onAction('StatusNotification', async (payload, ctx) => {
  await saveConnectorStatus(ctx.chargePointId, payload);
  return {};
});
```


Combine com os hooks de ciclo de vida. `onConnect` / `onDisconnect` dizem quando o WebSocket aparece ou some; StatusNotification diz o que o hardware acha que cada conector está fazendo. Juntos respondem: “essa estação está online, e dá pra plugar?”


Liste os sockets vivos no registry quando precisar de inventário:


```ts
const online = app.ocpp.registry.list();
const only21 = app.ocpp.registry.list('2.1');
```


Comando de saída deve checar presença primeiro. Chamar estação desconectada tem que falhar rápido na sua API — não deixar o dashboard do operador pendurado.


## Autorização e uma sessão de carga 1.6


Cartão RFID, token de app e lista local de autorização passam por `Authorize` no fio. Seu handler decide Accept vs Invalid (e status relacionados) com base no seu store de usuários:


```ts
app.ocpp.onAction('Authorize', async (payload, ctx) => {
  const idTag = String(payload.idTag ?? '');
  const ok = await isAllowedToCharge(idTag, ctx.chargePointId);

  return {
    idTagInfo: { status: ok ? 'Accepted' : 'Invalid' },
  };
});
```


No OCPP **1.6**, uma sessão típica fica assim:


1. `Authorize` — checagem de credencial.
2. `StartTransaction` — você gera um `transactionId` e dá Accept.
3. `MeterValues` — amostras periódicas de energia enquanto carrega.
4. `StopTransaction` — leitura final do medidor; você fecha a sessão.


StartTransaction é onde o CSMS deixa de ser só um sumidouro de heartbeat:


```ts
app.ocpp.onAction('StartTransaction', async (payload, ctx) => {
  const transactionId = await createTransaction({
    chargePointId: ctx.chargePointId,
    idTag: payload.idTag,
    connectorId: payload.connectorId,
    meterStart: payload.meterStart,
    timestamp: payload.timestamp,
  });

  return {
    transactionId,
    idTagInfo: { status: 'Accepted' },
  };
});
```


Mantenha o `transactionId` como inteiro (1.6) sob o seu controle. A estação ecoa esse id em MeterValues e StopTransaction. Persista as amostras do medidor pra conseguir faturar depois, mesmo se o stop final atrasar:


```ts
app.ocpp.onAction('MeterValues', async (payload, ctx) => {
  await appendMeterSamples(ctx.chargePointId, payload);
  return {};
});
```


StopTransaction fecha energia e códigos de motivo:


```ts
app.ocpp.onAction('StopTransaction', async (payload, ctx) => {
  await closeTransaction({
    chargePointId: ctx.chargePointId,
    transactionId: payload.transactionId,
    meterStop: payload.meterStop,
    timestamp: payload.timestamp,
    reason: payload.reason,
  });

  return {
    idTagInfo: { status: 'Accepted' },
  };
});
```


Esse loop de quatro actions já dá pra demo de frota privada, lab ou piloto interno. O resto — tarifa, recibo, roaming — se apoia em transação e histórico de medidor persistidos.


## Handlers por versão e sessões 2.x


Algumas actions existem em toda versão; outras não. Dá pra registrar um handler pra todas as versões habilitadas, ou fixar:


```ts
app.ocpp.onAction('Authorize', authorizeHandler);        // todas as versões
app.ocpp.onAction('Authorize', authorize16, '1.6');      // só 1.6
```


No OCPP **2.0.1 / 2.1**, Start/Stop viram **`TransactionEvent`** (Started / Updated / Ended) e o start/stop remoto vira **`RequestStartTransaction`** / **`RequestStopTransaction`**. Chaves de configuração viram device model (`GetVariables` / `SetVariables`). O modelo mental continua: a estação reporta o ciclo de vida, o CSMS persiste e decide — só mudam nomes de campo e quantidade de mensagens.


Quando o mesmo nome de handler vale pra várias versões (BootNotification é o clássico), ramifique em `ctx.version` e devolva o formato certo. Prefira adapters pequenos por versão a um mega-handler que decora todos os schemas.


Registre um fallback pra action sem implementação falhar alto em vez de travar:


```ts
app.ocpp.onAny(async (_payload, ctx) => {
  throw new Error(`Not implemented: ${ctx.action} (${ctx.version})`);
});
```


Erro lançado vira CALLERROR. Melhor do que sumir em silêncio quando a estação manda `FirmwareStatusNotification` e você ainda não decidiu o que fazer.


## CSMS → estação: quem chama é você


O tráfego é nos dois sentidos. Operador destrava conector, faz soft-reset e inicia sessão pelo app. Isso vira CALL de saída:


```ts
const result = await app.ocpp.call('CP_001', 'Reset', { type: 'Soft' });
```


No 1.6, start remoto fica assim:


```ts
await app.ocpp.call('CP_001', 'RemoteStartTransaction', {
  idTag: 'USER_42',
  connectorId: 1,
});
```


No 2.x você chama `RequestStartTransaction` com o payload 2.x. Também dá pra pegar o objeto de conexão quando precisa da versão negociada antes de escolher o nome da action:


```ts
const conn = app.ocpp.getConnection('CS_002');
if (!conn) throw new Error('Station offline');

if (conn.version === '1.6') {
  await conn.call('RemoteStartTransaction', { idTag: 'USER_42', connectorId: 1 });
} else {
  await conn.call('RequestStartTransaction', {
    /* monte um payload 2.x pro seu produto */
  });
}
```


Um padrão que funciona bem: uma fachada HTTP (ou fila) magra na frente do `call`. A UI do produto nunca fala array OCPP direto; ela posta “reset CP_001” e o serviço traduz na action certa pra versão que está viva.


## Um esqueleto de CSMS que faz sentido


Resista à vontade de implementar as 90+ actions do 2.1 no dia um. Entregue um corte vertical:


| Preocupação | Actions pra tratar primeiro |
|-------------|----------------------------|
| Presença | BootNotification, Heartbeat, StatusNotification |
| Acesso | Authorize |
| Energia (1.6) | StartTransaction, MeterValues, StopTransaction |
| Ops | Reset, UnlockConnector, RemoteStart/Stop (ou Request* no 2.x) |


Depois venha persistência (Postgres serve), lista admin de estações online e log estruturado com `chargePointId`, `uniqueId` e `action`. Só então vá atrás de perfil de smart charging, lista local de auth, update de firmware ou extra de ISO 15118.


Limites sugeridos no código:


```text
HTTP / fila de operadores  →  serviços de aplicação  →  ocpp.onAction / ocpp.call
                                                          ↑
                                             framing, schemas, registry
```


Deixe matemática de tarifa e store de identidade fora da camada WebSocket. Handler chama serviço; serviço não parseia array CALL.


## Testando sem ter um estacionamento


Você não precisa de carregador físico pra aprender. Opções que funcionam cedo:


- Smoke / servidor de exemplo do pacote — BootNotification contra um listener local.
- Simuladores open-source de estação que falam OCPP-J e deixam você escolher o subprotocolo.
- Um cliente WebSocket mínimo no teste que manda um array CALL e confere o CALLRESULT.


Nos testes automatizados, assert três coisas: negociação de subprotocolo, rejeição por schema de payload ruim, e resultado de handler pra Authorize / Start / Stop. Conformance com hardware vem depois; cobertura unitária e de integração das suas decisões de domínio vem primeiro.


## Notas de produção que salvam o fim de semana


**Use `wss://` e autentique a estação.** O protocolo assume canal confiável; coloque TLS e credencial da estação (mTLS ou handshake de token antes do upgrade) na frente do path OCPP.


**Uma conexão por id de estação** é a regra usual. Socket duplicado costuma ser corrida de reconnect instável — rejeitar o segundo é mais claro do que dois heartbeats brigando por status.


**Relógio importa.** Respostas de BootNotification e Heartbeat carregam `currentTime`; a estação usa isso. Prefira host alinhado a NTP e timestamp ISO-8601 em tudo que persistir.


**Idempotência e reconnect.** Estação retenta. Desenhe a criação de transação pra StartTransaction duplicado com a mesma credencial não virar duas faturas sem revisão.


**Política de versão.** Suportar 1.6 + 2.x é realista em frota mista; só 2.1 serve pra greenfield. Documente o que seu CSMS afirma e teste a preferência de negociação de forma explícita.


**Observabilidade.** Logue action, version, chargePointId e latência em todo CALL. Quando o site diz “carregamento quebrou”, esses quatro campos são o caminho mais curto da verdade.


**Planeje estação offline.** Link cai. Faça a UX de operação tratar “estação offline” como estado de primeira classe, enfileire comando não urgente com cuidado e nunca assuma que MeterValues chegou só porque StartTransaction chegou. O modelo de persistência precisa aguentar buraco e StopTransaction atrasado sem inventar energia que nunca passou no fio.


## O que a biblioteca não faz (de propósito)


Biblioteca OCPP não inventa o seu produto. Regra de auth, hub de roaming, billing, balanceamento no alimentador e app do cliente são seus. As peças reutilizáveis que valem a pena: formato do endpoint WebSocket, negociação de subprotocolo, framing CALL, validação de schema OCA, registry de conexões e uma API limpa `onAction` / `call`.


Se você se pegar forjando a biblioteca pra mudar lógica de tarifa, pare — isso é handler. Se você se pegar reimplementando framing de array, pare — isso é biblioteca.


## Pra onde ir daqui


Agora você tem o quadro do protocolo: estação conecta com subprotocolo, fala array JSON, faz boot, heartbeat, autoriza e roda sessão. Tem um conjunto mínimo de handlers e um caminho pra controle de saída.


O próximo passo depende do objetivo. Quem explora em lab pluga um simulador e acompanha Boot → Authorize → Start → Meter → Stop no log. Time de produto escolhe política de versão, desenha o schema de transação e coloca API de operação na frente do `call`. Operador de frota adiciona dashboard de StatusNotification e alerta heartbeat sumido antes de caçar feature exótica do 2.1.


OCPP parece enorme porque o catálogo completo de actions é enorme. A porta de entrada é pequena: aceite um socket, responda BootNotification, ganhe Heartbeats, depois ganhe uma transação. O resto é crescimento em cima de uma conversa estável entre o seu processo Node e um carregador que finalmente tem alguém inteligente do outro lado do fio.
