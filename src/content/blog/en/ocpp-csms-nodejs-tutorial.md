---
title: 'Building an OCPP CSMS in Node.js: From Zero to Talking Stations'
date: '2026-08-10'
tags:
  - ocpp
  - ev-charging
  - nodejs
  - websocket
  - typescript
  - tutorial
description: >-
  A practical introduction to OCPP for Node developers. Learn how charging
  stations talk to a Central System, how JSON-over-WebSocket framing works, and
  how to grow a minimal CSMS from BootNotification to real sessions.
---


If you have spent any time around electric vehicle charging software, you have probably seen the acronym **OCPP**. It stands for Open Charge Point Protocol, and it is the language most public chargers use to talk to a backend. That backend is usually called a **CSMS** — Charging Station Management System (you will also see “Central System” in older docs).


This post is for Node.js developers who want to stand up a CSMS, or who are researching how OCPP fits together before committing to a stack. We will stay close to the protocol: what connects, what messages look like, which actions matter first, and how to grow from “station is online” to “session started and stopped.” The examples use a small Node library that implements OCPP-J (JSON over WebSocket) for versions 1.6, 2.0.1, and 2.1. Treat the library as the pipe; treat this guide as the map.


## What you are actually building


A CSMS is not a REST API with a few charging endpoints. Stations open a **long-lived WebSocket**, negotiate a protocol version, then exchange **RPC-style messages**. Your server accepts those connections, validates payloads against the official schemas, answers station-initiated calls, and occasionally initiates calls of its own (remote start, reset, unlock connector, and so on).


Think in three layers:


1. **Transport** — WebSocket upgrade, subprotocol negotiation, connection identity.
2. **Framing** — CALL, CALLRESULT, CALLERROR as JSON arrays.
3. **Domain** — who may charge, transaction IDs, meter data, tariffs, smart charging.


A good OCPP library owns (1) and (2). You own (3). That separation is the whole point: you should not re-implement message framing every time you change your billing rules.


## Actors and vocabulary


Two roles matter on day one:


- **Charging Station** (historically *Charge Point*) — the hardware or simulator at the site.
- **CSMS** — your Node process that accepts `ws://…/ocpp/:chargePointId` (or `wss://` in production).


Identity usually rides in the URL path. A station connects as something like:


```text
wss://csms.example.com/ocpp/CP_001
```


The `CP_001` segment is the station id your registry will key on. The **OCPP version is not in the path**. It arrives as a WebSocket subprotocol offer in `Sec-WebSocket-Protocol`:


| Client offers | Negotiated version |
|---------------|--------------------|
| `ocpp1.6` | OCPP 1.6 |
| `ocpp2.0.1` | OCPP 2.0.1 |
| `ocpp2.1` | OCPP 2.1 |


One shared path for every station, one preference list on the server, and negotiation picks the best mutual match. If nothing matches, the upgrade should fail. That design lets a mixed fleet — old 1.6 boxes and newer 2.x firmware — hit the same endpoint.


This tutorial covers **OCPP-J only** (JSON over WebSocket). Classic SOAP 1.6 exists in the wild, but modern Node CSMS work almost always means OCPP-J.


## The message envelope


Forget REST verbs for a moment. Every OCPP-J message is a JSON **array**:


| Type | Shape |
|------|--------|
| CALL | `[2, uniqueId, action, payload]` |
| CALLRESULT | `[3, uniqueId, payload]` |
| CALLERROR | `[4, uniqueId, errorCode, errorDescription, errorDetails]` |


`uniqueId` correlates a request with its result or error. `action` is a string such as `BootNotification` or `Authorize`. `payload` is a JSON object whose fields are defined by the Open Charge Alliance schemas for that version.


A station that just powered up might send:


```json
[2, "boot-1", "BootNotification", {
  "chargePointVendor": "Acme",
  "chargePointModel": "Wallbox-7"
}]
```


That payload shape is OCPP **1.6**. On 2.0.1 / 2.1 the same action uses a nested `chargingStation` object and a `reason` field. Your handlers must branch on the negotiated version when payloads diverge — same action name, different contracts.


Your CSMS answers with a CALLRESULT that reuses the same `uniqueId`:


```json
[3, "boot-1", {
  "status": "Accepted",
  "currentTime": "2026-08-10T12:00:00.000Z",
  "interval": 300
}]
```


`interval` tells the station how often to send Heartbeat messages (seconds). Accepting a boot is how you put a station on your “online and managed” list.


## Install and a minimal server


You need Node 18+. Install the OCPP CSMS package (and its HTTP/WebSocket host) from npm:


```bash
npm install fastify-ocpp
```


Register the OCPP layer on your server with the versions you intend to support. Newest-first is a sensible default preference:


```ts
import { fastifyOcpp } from 'fastify-ocpp';

await app.register(fastifyOcpp, {
  versions: ['2.1', '2.0.1', '1.6'],
  path: '/ocpp',
});
```


After registration you get an `ocpp` surface: register inbound handlers, send outbound calls, inspect the live connection registry. Configuration worth knowing early:


- **`versions`** — allow-list and preference order for subprotocol negotiation.
- **`path`** — shared prefix; `/:chargePointId` is appended automatically.
- **`validateIncoming` / `validateOutgoing`** — schema validation against OCA JSON schemas (on by default).
- **`callTimeoutMs`** — how long outbound CALLs wait for a result.
- **`rejectDuplicateConnections`** — whether a second socket for the same id is rejected.
- **`onConnect` / `onDisconnect`** — hooks for logging, metrics, or presence updates.


Schema validation is not optional polish. Stations and CSMS implementations disagree in subtle ways; rejecting malformed payloads with CALLERROR is how you stay interoperable instead of debugging silent nonsense three weeks later.


## First handlers: Boot and Heartbeat


Every healthy station relationship starts with BootNotification, then a heartbeat cadence. Register those before you invent billing:


```ts
app.ocpp.onAction('BootNotification', async (payload, ctx) => {
  // Persist vendor/model (or chargingStation) keyed by ctx.chargePointId
  console.log('boot', ctx.chargePointId, ctx.version, payload);

  return {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300,
  };
});
```


The handler receives the decoded payload and a context with `chargePointId`, `version`, `uniqueId`, `action`, and the socket. Return a plain object; the library wraps it as CALLRESULT and validates it.


Heartbeat is even smaller — stations ping so you know the link is alive:


```ts
app.ocpp.onAction('Heartbeat', async () => ({
  currentTime: new Date().toISOString(),
}));
```


Start the process and point a simulator or a real station at `ws://localhost:9000/ocpp/CP_001` with the appropriate subprotocol. When BootNotification lands and Heartbeats follow on your interval, the transport path is proven. Celebrate quietly, then add domain logic.


## Status and presence


Stations report connector state with `StatusNotification` (Available, Preparing, Charging, Faulted, and friends). You do not need deep business rules yet — store the latest status per connector and surface it on an operator UI:


```ts
app.ocpp.onAction('StatusNotification', async (payload, ctx) => {
  await saveConnectorStatus(ctx.chargePointId, payload);
  return {};
});
```


Pair that with connection lifecycle hooks. `onConnect` / `onDisconnect` tell you when the WebSocket appears or vanishes; StatusNotification tells you what the hardware thinks each connector is doing. Together they answer “is this station online, and can someone plug in?”


List live sockets from the registry when you need an inventory:


```ts
const online = app.ocpp.registry.list();
const only21 = app.ocpp.registry.list('2.1');
```


Outbound commands should check presence first. Calling a station that is not connected should fail fast in your API layer rather than hanging an operator dashboard.


## Authorization and a 1.6 charge session


RFID cards, app tokens, and local authorization lists all funnel through `Authorize` on the wire. Your handler decides Accept vs Invalid (and related statuses) based on your own user store:


```ts
app.ocpp.onAction('Authorize', async (payload, ctx) => {
  const idTag = String(payload.idTag ?? '');
  const ok = await isAllowedToCharge(idTag, ctx.chargePointId);

  return {
    idTagInfo: { status: ok ? 'Accepted' : 'Invalid' },
  };
});
```


On OCPP **1.6**, a typical session looks like this:


1. `Authorize` — credential check.
2. `StartTransaction` — you assign a `transactionId` and Accept.
3. `MeterValues` — periodic energy samples while charging.
4. `StopTransaction` — final meter reading; you close the session.


StartTransaction is where your CSMS becomes more than a heartbeat sink:


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


Keep `transactionId` as an integer (1.6) that you control. Stations will echo it on MeterValues and StopTransaction. Persist meter samples so you can invoice later even if the final stop message is delayed:


```ts
app.ocpp.onAction('MeterValues', async (payload, ctx) => {
  await appendMeterSamples(ctx.chargePointId, payload);
  return {};
});
```


StopTransaction finalizes energy and reason codes:


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


That four-action loop is enough to demo a private fleet, a lab setup, or an internal pilot. Everything else — tariffs, receipts, roaming — builds on persisted transactions and meter history.


## Version-scoped handlers and 2.x sessions


Some actions exist on every version; some do not. You can register a handler for all enabled versions, or pin it:


```ts
app.ocpp.onAction('Authorize', authorizeHandler);        // all versions
app.ocpp.onAction('Authorize', authorize16, '1.6');      // 1.6 only
```


OCPP **2.0.1 / 2.1** collapse Start/Stop into **`TransactionEvent`** (Started / Updated / Ended) and rename remote start/stop to **`RequestStartTransaction`** / **`RequestStopTransaction`**. Configuration keys become a device model (`GetVariables` / `SetVariables`). The mental model stays the same — station reports lifecycle, CSMS persists and decides — but field names and message counts change.


When you share one handler name across versions (BootNotification is the classic case), branch on `ctx.version` and return the correct response shape. Prefer small adapters per version over one mega-handler that knows every schema by heart.


Register a fallback so unimplemented actions fail loudly instead of hanging:


```ts
app.ocpp.onAny(async (_payload, ctx) => {
  throw new Error(`Not implemented: ${ctx.action} (${ctx.version})`);
});
```


Thrown errors become CALLERROR responses. That is better than silent drops when a station sends `FirmwareStatusNotification` and you have not decided what to do yet.


## CSMS → station: you call them


Traffic is bidirectional. Operators unlock connectors, soft-reset boxes, and start sessions from a mobile app. Those are outbound CALLs:


```ts
const result = await app.ocpp.call('CP_001', 'Reset', { type: 'Soft' });
```


On 1.6, remote start looks like:


```ts
await app.ocpp.call('CP_001', 'RemoteStartTransaction', {
  idTag: 'USER_42',
  connectorId: 1,
});
```


On 2.x you would call `RequestStartTransaction` with the 2.x payload shape instead. You can also grab the connection object when you need the negotiated version before choosing an action name:


```ts
const conn = app.ocpp.getConnection('CS_002');
if (!conn) throw new Error('Station offline');

if (conn.version === '1.6') {
  await conn.call('RemoteStartTransaction', { idTag: 'USER_42', connectorId: 1 });
} else {
  await conn.call('RequestStartTransaction', {
    /* build a 2.x payload for your product */
  });
}
```


A practical pattern is a thin HTTP (or queue) façade in front of `call`: your product UI never speaks OCPP arrays directly; it posts “reset CP_001” and your service translates that into the right action for the live version.


## A sane CSMS skeleton


Resist the urge to implement all 90+ 2.1 actions on day one. Ship a vertical slice:


| Concern | Actions to handle first |
|---------|-------------------------|
| Presence | BootNotification, Heartbeat, StatusNotification |
| Access | Authorize |
| Energy (1.6) | StartTransaction, MeterValues, StopTransaction |
| Ops | Reset, UnlockConnector, RemoteStart/Stop (or 2.x Request*) |


Then add persistence (Postgres is fine), an admin list of online stations, and structured logs that include `chargePointId`, `uniqueId`, and `action`. Only after that should you chase smart charging profiles, local auth lists, firmware updates, or ISO 15118 extras.


Suggested boundaries in code:


```text
HTTP / queue operators  →  application services  →  ocpp.onAction / ocpp.call
                                                      ↑
                                         framing, schemas, registry
```


Keep tariff math and identity stores out of the WebSocket layer. Handlers should call into services; services should not parse CALL arrays.


## Testing without a parking lot


You do not need a physical charger to learn. Options that work well early:


- The package smoke / example server patterns — BootNotification against a local listener.
- Open-source station simulators that speak OCPP-J and let you pick a subprotocol.
- A tiny WebSocket client in a test that sends a CALL array and asserts the CALLRESULT.


Assert three things in automated tests: subprotocol negotiation, schema rejection of bad payloads, and handler outcomes for Authorize / Start / Stop. Hardware conformance testing comes later; unit and integration coverage of your domain decisions comes first.


## Production notes that save weekends


**Use `wss://` and authenticate the station.** The protocol assumes a trusted channel; put TLS and station credentials (mTLS or token handshake before upgrade) in front of the OCPP path.


**One connection per station id** is the usual rule. Duplicate sockets often mean a flaky reconnect race — rejecting the second connection is clearer than dual heartbeats writing conflicting status.


**Time sync matters.** BootNotification and Heartbeat responses carry `currentTime`; stations use it. Prefer NTP-aligned hosts and ISO-8601 timestamps everywhere you persist.


**Idempotency and reconnects.** Stations retry. Design transaction creation so duplicate StartTransaction with the same credentials does not mint two invoices without review.


**Version policy.** Supporting 1.6 + 2.x is realistic for mixed fleets; supporting only 2.1 is fine for greenfield. Document which versions your CSMS claims, and test negotiation preference explicitly.


**Observability.** Log action, version, chargePointId, and latency for every CALL. When a site says “charging is broken,” those four fields are how you find the truth in under a minute.


**Plan for offline stations.** Links drop. Design operator UX so “station offline” is a first-class state, queue non-urgent commands carefully, and never assume MeterValues arrived just because StartTransaction did. Your persistence model should tolerate gaps and late StopTransaction messages without inventing energy that never hit the wire.


## What the library does not do (on purpose)


OCPP libraries should not invent your product. Auth rules, roaming hubs, billing, load balancing across feeders, and customer apps are yours. The valuable reusable pieces are: WebSocket endpoint shape, subprotocol negotiation, CALL framing, OCA schema validation, a connection registry, and a clean `onAction` / `call` API.


If you find yourself forking the library to change tariff logic, stop — that logic belongs in a handler. If you find yourself re-implementing array framing, stop — that belongs in the library.


## Where to go next


You now have the protocol picture: stations connect with a subprotocol, speak JSON arrays, boot, heartbeat, authorize, and run sessions. You have a minimal handler set and a path to outbound control.


Next steps depend on your goal. Lab explorers should wire a simulator and watch Boot → Authorize → Start → Meter → Stop in logs. Product teams should pick a version policy, design the transaction schema, and put an operator API in front of `call`. Fleet operators should add StatusNotification dashboards and alert on missing heartbeats before chasing exotic 2.1 features.


OCPP looks large because the full action catalog is large. The path into it is small: accept a socket, answer BootNotification, earn Heartbeats, then earn a transaction. Everything else is growth on top of a stable conversation between your Node process and a charger that finally has something intelligent on the other end of the wire.
