---
title: 'Construindo um CSMS OCPP em Node.js: Do Zero até Falar com Estações'
date: '2026-08-10'
tags:
  - ocpp
  - carregamento-ev
  - nodejs
  - websocket
  - typescript
  - tutorial
description: >-
  Introdução prática ao OCPP para quem desenvolve em Node. Entenda como
  estações de carga falam com um Sistema Central, como funciona o framing
  JSON sobre WebSocket e como evoluir um CSMS mínimo do BootNotification
  até sessões reais.
---


Se você circulou por software de carregamento de veículos elétricos, provavelmente já viu a sigla **OCPP**. Ela significa Open Charge Point Protocol — a linguagem que a maioria dos carregadores públicos usa para falar com um backend. Esse backend costuma se chamar **CSMS** — Charging Station Management System (nos docs mais antigos você também vê “Central System”).


Este post é para quem trabalha com Node.js e quer levantar um CSMS, ou está pesquisando como o OCPP se encaixa antes de escolher stack. Vamos ficar perto do protocolo: o que conecta, como as mensagens se parecem, quais ações importam primeiro e como crescer de “estação online” para “sessão iniciada e encerrada.” Os exemplos usam uma biblioteca Node pequena que implementa OCPP-J (JSON sobre WebSocket) nas versões 1.6, 2.0.1 e 2.1. Trate a biblioteca como o tubo; trate este guia como o mapa.


## O que você está construindo de verdade


Um CSMS não é uma API REST com alguns endpoints de carga. As estações abrem um **WebSocket de longa duração**, negociam a versão do protocolo e trocam **mensagens no estilo RPC**. Seu servidor aceita essas conexões, valida payloads contra os schemas oficiais, responde a chamadas iniciadas pela estação e, de vez em quando, inicia chamadas próprias (start remoto, reset, unlock do conector, e por aí).


Pense em três camadas:


1. **Transporte** — upgrade WebSocket, negociação de subprotocolo, identidade da conexão.
2. **Framing** — CALL, CALLRESULT, CALLERROR como arrays JSON.
3. **Domínio** — quem pode carregar, IDs de transação, dados de medidor, tarifas, smart charging.


Uma boa biblioteca OCPP cuida de (1) e (2). Você cuida de (3). Essa separação é o ponto todo: você não deveria reimplementar framing de mensagem toda vez que muda a regra de faturamento.


## Atores e vocabulário


Dois papéis importam no primeiro dia:


- **Charging Station** (historicamente *Charge Point*) — o hardware ou simulador no site.
- **CSMS** — seu processo Node que aceita `ws://…/ocpp/:chargePointId` (ou `wss://` em produção).


A identidade normalmente vem no path da URL. Uma estação conecta assim:


```text
wss://csms.example.com/ocpp/CP_001
```


O segmento `CP_001` é o id da estação que seu registry vai indexar. A **versão OCPP não está no path**. Ela chega como oferta de subprotocolo WebSocket em `Sec-WebSocket-Protocol`:


| Cliente oferece | Versão negociada |
|-----------------|------------------|
| `ocpp1.6` | OCPP 1.6 |
| `ocpp2.0.1` | OCPP 2.0.1 |
| `ocpp2.1` | OCPP 2.1 |


Um path compartilhado para todas as estações, uma lista de preferência no servidor, e a negociação escolhe o melhor match mútuo. Se nada casa, o upgrade deve falhar. Esse desenho permite frota mista — caixas 1.6 antigas e firmware 2.x novo — no mesmo endpoint.


Este tutorial cobre **somente OCPP-J** (JSON sobre WebSocket). O SOAP 1.6 clássico ainda existe no campo, mas CSMS moderno em Node quase sempre significa OCPP-J.


## O envelope da mensagem


Esqueça verbos REST por um momento. Toda mensagem OCPP-J é um **array** JSON:


| Tipo | Forma |
|------|--------|
| CALL | `[2, uniqueId, action, payload]` |
| CALLRESULT | `[3, uniqueId, payload]` |
| CALLERROR | `[4, uniqueId, errorCode, errorDescription, errorDetails]` |


`uniqueId` correlaciona pedido com resultado ou erro. `action` é uma string como `BootNotification` ou `Authorize`. `payload` é um objeto JSON cujos campos vêm dos schemas da Open Charge Alliance para aquela versão.


Uma estação que acabou de ligar pode enviar:


```json
[2, "boot-1", "BootNotification", {
  "chargePointVendor": "Acme",
  "chargePointModel": "Wallbox-7"
}]
```


Esse formato de payload é OCPP **1.6**. Em 2.0.1 / 2.1 a mesma ação usa um objeto aninhado `chargingStation` e um campo `reason`. Seus handlers precisam ramificar na versão negociada quando os payloads divergem — mesmo nome de ação, contratos diferentes.


Seu CSMS responde com um CALLRESULT reusando o mesmo `uniqueId`:


```json
[3, "boot-1", {
  "status": "Accepted",
  "currentTime": "2026-08-10T12:00:00.000Z",
  "interval": 300
}]
```


`interval` diz à estação com que frequência enviar Heartbeat (segundos). Aceitar o boot é como colocar a estação na sua lista de “online e gerenciada.”


## Instalação e um servidor mínimo


Você precisa de Node 18+. Instale o pacote CSMS OCPP (e o host HTTP/WebSocket) via npm:


```bash
npm install fastify-ocpp
```


Registre a camada OCPP no servidor com as versões que pretende suportar. Preferir a mais nova primeiro é um default sensato:


```ts
import { fastifyOcpp } from 'fastify-ocpp';

await app.register(fastifyOcpp, {
  versions: ['2.1', '2.0.1', '1.6'],
  path: '/ocpp',
});
```


Depois do registro você ganha uma superfície `ocpp`: registrar handlers de entrada, enviar calls de saída, inspecionar o registry de conexões vivas. Configuração que vale conhecer cedo:


- **`versions`** — allow-list e ordem de preferência na negociação de subprotocolo.
- **`path`** — prefixo compartilhado; `/:chargePointId` é anexado automaticamente.
- **`validateIncoming` / `validateOutgoing`** — validação contra schemas JSON da OCA (ligada por padrão).
- **`callTimeoutMs`** — quanto tempo CALLs de saída esperam resultado.
- **`rejectDuplicateConnections`** — se um segundo socket para o mesmo id é rejeitado.
- **`onConnect` / `onDisconnect`** — hooks para log, métricas ou presença.


Validação de schema não é verniz opcional. Estações e implementações de CSMS discordam de formas sutis; rejeitar payloads malformados com CALLERROR é como permanecer interoperável em vez de depurar silêncio absurdo três semanas depois.


## Primeiros handlers: Boot e Heartbeat


Toda relação saudável com uma estação começa com BootNotification e depois um ritmo de heartbeat. Registre isso antes de inventar billing:


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


O handler recebe o payload decodificado e um contexto com `chargePointId`, `version`, `uniqueId`, `action` e o socket. Retorne um objeto simples; a biblioteca empacota como CALLRESULT e valida.


Heartbeat é ainda menor — as estações pingam para você saber que o link está vivo:


```ts
app.ocpp.onAction('Heartbeat', async () => ({
  currentTime: new Date().toISOString(),
}));
```


Suba o processo e aponte um simulador ou estação real para `ws://localhost:9000/ocpp/CP_001` com o subprotocolo adequado. Quando BootNotification chegar e Heartbeats seguirem no seu intervalo, o caminho de transporte está provado. Comemore em silêncio e então adicione lógica de domínio.


## Status e presença


Estações reportam estado do conector com `StatusNotification` (Available, Preparing, Charging, Faulted, e companhia). Você ainda não precisa de regras de negócio profundas — guarde o último status por conector e mostre numa UI de operação:


```ts
app.ocpp.onAction('StatusNotification', async (payload, ctx) => {
  await saveConnectorStatus(ctx.chargePointId, payload);
  return {};
});
```


Combine isso com hooks de ciclo de vida da conexão. `onConnect` / `onDisconnect` dizem quando o WebSocket aparece ou some; StatusNotification diz o que o hardware acha que cada conector está fazendo. Juntos respondem “esta estação está online, e alguém pode plugar?”


Liste sockets vivos no registry quando precisar de inventário:


```ts
const online = app.ocpp.registry.list();
const only21 = app.ocpp.registry.list('2.1');
```


Comandos de saída devem checar presença primeiro. Chamar uma estação que não está conectada deve falhar rápido na sua camada de API em vez de deixar o dashboard do operador pendurado.


## Autorização e uma sessão de carga 1.6


Cartões RFID, tokens de app e listas locais de autorização passam por `Authorize` no fio. Seu handler decide Accept vs Invalid (e status relacionados) com base no seu próprio store de usuários:


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
2. `StartTransaction` — você atribui um `transactionId` e Accept.
3. `MeterValues` — amostras periódicas de energia enquanto carrega.
4. `StopTransaction` — leitura final do medidor; você fecha a sessão.


StartTransaction é onde seu CSMS vira mais do que um sumidouro de heartbeat:


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


Mantenha `transactionId` como inteiro (1.6) sob seu controle. As estações vão ecoá-lo em MeterValues e StopTransaction. Persista amostras de medidor para faturar depois mesmo se a mensagem final de stop atrasar:


```ts
app.ocpp.onAction('MeterValues', async (payload, ctx) => {
  await appendMeterSamples(ctx.chargePointId, payload);
  return {};
});
```


StopTransaction finaliza energia e códigos de motivo:


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


Esse loop de quatro ações já basta para demo de frota privada, lab ou piloto interno. Todo o resto — tarifas, recibos, roaming — se apoia em transações e histórico de medidor persistidos.


## Handlers por versão e sessões 2.x


Algumas ações existem em toda versão; outras não. Você pode registrar um handler para todas as versões habilitadas, ou fixar:


```ts
app.ocpp.onAction('Authorize', authorizeHandler);        // todas as versões
app.ocpp.onAction('Authorize', authorize16, '1.6');      // só 1.6
```


OCPP **2.0.1 / 2.1** colapsa Start/Stop em **`TransactionEvent`** (Started / Updated / Ended) e renomeia start/stop remoto para **`RequestStartTransaction`** / **`RequestStopTransaction`**. Chaves de configuração viram um device model (`GetVariables` / `SetVariables`). O modelo mental continua o mesmo — a estação reporta ciclo de vida, o CSMS persiste e decide — mas nomes de campo e contagem de mensagens mudam.


Quando você compartilha um nome de handler entre versões (BootNotification é o caso clássico), ramifique em `ctx.version` e devolva o formato de resposta correto. Prefira adapters pequenos por versão a um mega-handler que conhece todo schema de cor.


Registre um fallback para ações não implementadas falharem alto em vez de pendurar:


```ts
app.ocpp.onAny(async (_payload, ctx) => {
  throw new Error(`Not implemented: ${ctx.action} (${ctx.version})`);
});
```


Erros lançados viram respostas CALLERROR. Isso é melhor do que drops silenciosos quando a estação manda `FirmwareStatusNotification` e você ainda não decidiu o que fazer.


## CSMS → estação: você chama elas


O tráfego é bidirecional. Operadores destravam conectores, fazem soft-reset e iniciam sessões pelo app. Isso são CALLs de saída:


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


No 2.x você chamaria `RequestStartTransaction` com o formato de payload 2.x. Também pode pegar o objeto de conexão quando precisa da versão negociada antes de escolher o nome da ação:


```ts
const conn = app.ocpp.getConnection('CS_002');
if (!conn) throw new Error('Station offline');

if (conn.version === '1.6') {
  await conn.call('RemoteStartTransaction', { idTag: 'USER_42', connectorId: 1 });
} else {
  await conn.call('RequestStartTransaction', {
    /* monte um payload 2.x para o seu produto */
  });
}
```


Um padrão prático é uma fachada HTTP (ou fila) fina na frente de `call`: a UI do produto nunca fala arrays OCPP diretamente; ela posta “reset CP_001” e seu serviço traduz isso na ação certa para a versão viva.


## Um esqueleto de CSMS sensato


Resista à vontade de implementar todas as 90+ ações do 2.1 no dia um. Entregue um corte vertical:


| Preocupação | Ações para tratar primeiro |
|-------------|----------------------------|
| Presença | BootNotification, Heartbeat, StatusNotification |
| Acesso | Authorize |
| Energia (1.6) | StartTransaction, MeterValues, StopTransaction |
| Ops | Reset, UnlockConnector, RemoteStart/Stop (ou Request* no 2.x) |


Depois adicione persistência (Postgres serve), uma lista admin de estações online e logs estruturados com `chargePointId`, `uniqueId` e `action`. Só então persiga perfis de smart charging, listas locais de auth, updates de firmware ou extras ISO 15118.


Limites sugeridos no código:


```text
HTTP / fila de operadores  →  serviços de aplicação  →  ocpp.onAction / ocpp.call
                                                          ↑
                                             framing, schemas, registry
```


Mantenha matemática de tarifa e stores de identidade fora da camada WebSocket. Handlers devem chamar serviços; serviços não devem parsear arrays CALL.


## Testando sem um estacionamento


Você não precisa de um carregador físico para aprender. Opções que funcionam bem cedo:


- Padrões de smoke / servidor de exemplo do pacote — BootNotification contra um listener local.
- Simuladores open-source de estação que falam OCPP-J e deixam você escolher o subprotocolo.
- Um cliente WebSocket mínimo num teste que manda um array CALL e asserta o CALLRESULT.


Assert três coisas em testes automatizados: negociação de subprotocolo, rejeição por schema de payloads ruins, e resultados de handler para Authorize / Start / Stop. Conformance com hardware vem depois; cobertura unitária e de integração das suas decisões de domínio vem primeiro.


## Notas de produção que salvam fins de semana


**Use `wss://` e autentique a estação.** O protocolo assume um canal confiável; coloque TLS e credenciais da estação (mTLS ou handshake de token antes do upgrade) na frente do path OCPP.


**Uma conexão por id de estação** é a regra usual. Sockets duplicados costumam significar corrida de reconnect instável — rejeitar a segunda conexão é mais claro do que dual heartbeats escrevendo status conflitante.


**Sincronia de tempo importa.** Respostas de BootNotification e Heartbeat carregam `currentTime`; as estações usam isso. Prefira hosts alinhados a NTP e timestamps ISO-8601 em tudo que persistir.


**Idempotência e reconnects.** Estações retentam. Desenhe a criação de transação para que StartTransaction duplicado com as mesmas credenciais não gere duas faturas sem revisão.


**Política de versão.** Suportar 1.6 + 2.x é realista para frotas mistas; só 2.1 serve para greenfield. Documente quais versões seu CSMS reivindica e teste a preferência de negociação de forma explícita.


**Observabilidade.** Logue action, version, chargePointId e latência em todo CALL. Quando um site diz “o carregamento quebrou,” esses quatro campos são como achar a verdade em menos de um minuto.


**Planeje estações offline.** Links caem. Desenhe a UX de operação para que “estação offline” seja um estado de primeira classe, enfileire comandos não urgentes com cuidado e nunca assuma que MeterValues chegou só porque StartTransaction chegou. Seu modelo de persistência deve tolerar lacunas e StopTransaction atrasado sem inventar energia que nunca passou no fio.


## O que a biblioteca não faz (de propósito)


Bibliotecas OCPP não deveriam inventar o seu produto. Regras de auth, hubs de roaming, billing, balanceamento de carga no alimentador e apps de cliente são seus. As peças reutilizáveis valiosas são: formato do endpoint WebSocket, negociação de subprotocolo, framing CALL, validação de schema OCA, um registry de conexões e uma API limpa `onAction` / `call`.


Se você se pegar forjando a biblioteca para mudar lógica de tarifa, pare — essa lógica pertence a um handler. Se você se pegar reimplementando framing de arrays, pare — isso pertence à biblioteca.


## Para onde ir a seguir


Você agora tem o quadro do protocolo: estações conectam com um subprotocolo, falam arrays JSON, fazem boot, heartbeat, autorizam e rodam sessões. Você tem um conjunto mínimo de handlers e um caminho para controle de saída.


Os próximos passos dependem do seu objetivo. Quem explora em lab deve plugar um simulador e ver Boot → Authorize → Start → Meter → Stop nos logs. Times de produto devem escolher política de versão, desenhar o schema de transação e colocar uma API de operação na frente de `call`. Operadores de frota devem adicionar dashboards de StatusNotification e alertar heartbeats faltando antes de perseguir features exóticas do 2.1.


OCPP parece grande porque o catálogo completo de ações é grande. O caminho de entrada é pequeno: aceite um socket, responda BootNotification, ganhe Heartbeats, depois ganhe uma transação. Todo o resto é crescimento em cima de uma conversa estável entre o seu processo Node e um carregador que finalmente tem algo inteligente do outro lado do fio.
