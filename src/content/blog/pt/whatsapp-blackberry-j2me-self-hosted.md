---
title: 'WhatsApp no BlackBerry antigo: guia prático com J2ME'
description: 'Volte a trocar mensagens no BlackBerry clássico: hospede a ponte Baileys, compile o WhatsApp J2ME pelo navegador e conecte sua conta por QR code.'
date: '2026-10-23'
tags:
  - blackberry
  - j2me
  - whatsapp
  - self-hosting
  - retro
---

Digitar uma mensagem no teclado de um BlackBerry tem uma sensação que a tela de toque nunca substituiu muito bem. Se você ainda guarda um desses aparelhos, o WhatsApp J2ME é uma forma experimental de colocar esse teclado para trabalhar de novo.

A configuração tem duas partes: o **whatsapp-j2me**, cliente Java ME instalado no celular, e o **baileys-j2me**, a ponte que você hospeda em um computador ou servidor. Seu Android ou iPhone atual autoriza a conexão com a conta do WhatsApp por QR code. O BlackBerry se comunica com essa ponte.

É um projeto independente, sem vínculo com WhatsApp ou Meta. Ele não restaura o aplicativo oficial do BlackBerry. Compatibilidade e recursos dependem do aparelho, firmware, rede e servidor; encare como uma experiência de computação retrô, sem depender dele como única forma de receber mensagens.

## Primeiro, confira qual é o seu BlackBerry

O foco aqui são **aparelhos com BlackBerry OS clássico capazes de executar aplicativos Java ME**, e não modelos com BlackBerry 10, como Q10, Z10 ou Passport. Ter o nome BlackBerry na carcaça não garante que o aparelho instale um MIDlet.

Antes de compilar, confirme que seu modelo aceita aplicativos MIDP 2.0 / CLDC 1.1, tem acesso à internet e permite instalar um par JAR/JAD. Uma conexão Wi-Fi funcionando é um bom ponto de partida. Um plano de dados antigo ou uma página abrindo no navegador não prova que os aplicativos Java conseguem acessar seu servidor.

Você também precisa de uma conta atual do WhatsApp no Android ou iOS, um computador ou servidor Linux que permaneça ligado e um endereço acessível pelo BlackBerry. Celulares Symbian com o suporte Java ME necessário podem seguir a mesma ideia, mas instalação, permissões, certificados e limites de memória variam conforme o modelo.

## 1. Hospede a ponte Baileys J2ME

A ponte mantém a conexão moderna com o WhatsApp e oferece uma API que o cliente antigo consegue utilizar. Ela precisa ficar ligada enquanto você quiser trocar mensagens pelo BlackBerry.

Em uma máquina Linux com Git, Rust/Cargo e uma versão do Node.js ainda mantida e compatível com as dependências da ponte:

```bash
git clone https://github.com/mateuslacorte/baileys-j2me.git
cd baileys-j2me
npm --prefix node-bridge ci
cargo build --release
PORT=8085 NODE_PATH="$(command -v node)" ./target/release/baileys-j2me
```

Execute a partir da pasta do repositório. O binário inicia o processo Node por `node-bridge/bridge.js`, então copiar apenas o executável Rust não basta. Também são necessárias as dependências Node e uma pasta `sessions/` com permissão de escrita. Se a compilação apontar bibliotecas de sistema ausentes, instale os pacotes de desenvolvimento exigidos pela crate indicada para sua distribuição.

Por padrão, o servidor escuta em **todas as interfaces na porta 8085**. Antes de iniciá-lo em uma VPS, restrinja essa porta no firewall local ou do provedor; permita que o proxy reverso a acesse localmente. Esta versão não tem middleware de autenticação protegendo a API de dispositivos: o ID do aparelho não é uma senha. Mantenha a instalação em uma rede privada confiável ou adicione restrições de acesso compatíveis com seu celular antes de disponibilizá-la remotamente. TLS sozinho não controla quem acessa a API.

Para uma primeira verificação local, abra outro terminal no servidor:

```bash
curl http://127.0.0.1:8085/api/device/setup-check/status
```

Isso cria uma sessão de teste e deve retornar um status em JSON. O teste verifica a ponte Rust/Node, não um login concluído no WhatsApp. Não vincule sua conta a esse ID de teste; o aplicativo gera o próprio identificador.

### Mantenha o servidor ligado após sair do terminal

Para uma instalação persistente, coloque o repositório em `/opt/baileys-j2me`, pertencente a um usuário dedicado e sem privilégios chamado `baileys`. Instale primeiro o Node e as dependências de compilação; depois, como esse usuário, instale as dependências da ponte e compile o binário nessa pasta. O usuário precisa conseguir gravar em `sessions/`.

Salve o conteúdo abaixo em `/etc/systemd/system/baileys-j2me.service`, ajustando o caminho do Node conforme a saída de `command -v node`:

```ini
[Unit]
Description=Baileys J2ME bridge
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=baileys
WorkingDirectory=/opt/baileys-j2me
ExecStart=/opt/baileys-j2me/target/release/baileys-j2me
Environment=PORT=8085
Environment=NODE_PATH=/usr/bin/node
Restart=on-failure
RestartSec=5
UMask=0077

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now baileys-j2me
sudo systemctl status baileys-j2me
sudo journalctl -u baileys-j2me -n 50 --no-pager
```

Mantenha `sessions/` privada. Ela contém credenciais da conta e dados de mensagens; nunca deve ser servida como conteúdo do site nem enviada ao Git. Quem administra a ponte pode acessar as mensagens que passam por ela, então use um servidor sob seu controle e em que você confia.

### Crie um endereço que o celular consiga acessar

Use um hostname que resolva para seu servidor. Para acesso fora da rede local, configure DNS e as regras necessárias no roteador ou firewall. Coloque um proxy reverso na frente da ponte, com HTTPS e um certificado aceito pelo aparelho.

Dentro de um bloco `server` do Nginx que já tenha um certificado TLS funcionando, esta configuração encaminha a API pela raiz do domínio:

```nginx
location / {
    proxy_pass http://127.0.0.1:8085/;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_read_timeout 90s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Aplique suas restrições de acesso de rede também a esse virtual host. Execute `sudo nginx -t` antes de `sudo systemctl reload nginx`. Esse trecho configura o encaminhamento; ele não é uma configuração completa de TLS ou controle de acesso.

Nesse cenário, os dados do cliente são **host: seu hostname; porta: 443; protocolo: HTTPS; caminho da API: `/`**. Teste uma requisição a `https://seu-hostname/api/device/setup-check/status` em um computador autorizado antes de compilar o aplicativo.

Os certificados e o TLS dos BlackBerry antigos podem ser a parte mais trabalhosa. Confira data e hora do celular, cadeia de confiança e suporte ao protocolo negociado. Um certificado que funciona no notebook ainda pode falhar no aparelho. Alguns modelos exigem importar um certificado em formato DER. O [README da ponte](https://github.com/mateuslacorte/baileys-j2me#readme) aborda cenários de certificados e proxies antigos; habilitar TLS obsoleto ou cifras mais fracas reduz a segurança, então isole qualquer endpoint legado necessário. HTTP sem criptografia expõe o tráfego entre o celular e a ponte e deve ficar restrito a uma rede de testes confiável e isolada.

## 2. Compile o WhatsApp J2ME para o seu servidor

O aplicativo precisa conhecer os dados da **sua** ponte. Um JAR encontrado por aí pode estar configurado para o servidor de outra pessoa.

O [código do WhatsApp J2ME está disponível](https://github.com/mateuslacorte/whatsapp-j2me), e compilar por conta própria continua sendo uma opção. O caminho manual envolve uma cadeia de ferramentas Java ME antiga, pré-verificação de bytecode e empacotamento consistente de JAR/JAD, além dos dados corretos do servidor. Para quem quer usar o celular, preparar tudo isso pode consumir mais tempo do que o próprio aplicativo.

Para essa etapa, mantenho um [compilador de WhatsApp J2ME na minha área de membros](https://members.lacorte.dev/pt/tools/whatsapp-j2me). Você informa os dados do servidor pelo navegador e compila um aplicativo configurado para aquele endereço, sem montar o ambiente de desenvolvimento antigo. A assinatura apoia meus projetos independentes e é necessária para compilar; dá para experimentar a configuração da conexão antes de assinar. A ferramenta gera o cliente do celular; a hospedagem e a manutenção da ponte continuam com você.

1. Abra o compilador e informe o hostname ou IP, sem o prefixo de protocolo no campo de host.
2. Escolha a porta e o protocolo publicados pelo seu proxy.
3. Use `/` como caminho da API para a configuração na raiz mostrada acima. Uma instalação em subpasta exige uma rota correspondente no proxy e no cliente.
4. Confira o endereço final; depois entre na conta e ative a assinatura para compilar.
5. Baixe e extraia o ZIP com `WhatsApp.jar`, `WhatsApp.jad` e `MANIFEST.MF`.

Se mudar o endereço da ponte depois, gere uma nova compilação com os novos dados.

## 3. Instale no BlackBerry

Mantenha o JAR e o JAD gerados juntos. Em um BlackBerry OS compatível, tente abrir o JAD pelo navegador do aparelho em um endereço acessível por ele. O JAD aponta para o JAR, então preserve a localização relativa dos arquivos e não altere o JAR após a compilação: o descritor inclui seu tamanho em bytes.

Se hospedar os arquivos, use `text/vnd.sun.j2me.app-descriptor` para `.jad` e `application/java-archive` para `.jar`. Publique apenas os arquivos de instalação em uma pasta de downloads separada, nunca o repositório da ponte ou `sessions/`. Dependendo do modelo e firmware, a instalação local também pode estar disponível; siga o método aceito pelo seu aparelho. Ter um pacote JAR/JAD não garante que todo BlackBerry vá aceitá-lo.

Autorize o acesso à rede quando o aplicativo solicitar. Políticas corporativas, permissões de aplicativos, configurações de APN e diferenças no transporte de rede podem impedir a conexão mesmo com o app instalado. Teste primeiro pelo Wi-Fi, quando disponível, e investigue os dados móveis separadamente.

## 4. Conecte sua conta do WhatsApp

Inicie a ponte e abra o aplicativo instalado no BlackBerry. Quando conseguir acessar o servidor, o fluxo de vinculação do app deve exibir um QR code.

No Android ou iPhone que já tem sua conta, abra **WhatsApp → Aparelhos conectados → Conectar um aparelho** e escaneie o código. Aguarde a conexão da ponte e o carregamento das conversas; depois envie uma mensagem curta para um contato de confiança e confira a resposta.

O celular moderno autoriza a sessão vinculada. Não é um novo cadastro por SMS no BlackBerry, nem exige transferir seu número para o aparelho antigo. O histórico pode ficar incompleto; comece testando mensagens de texto novas, enviadas e recebidas. Não presuma suporte a chamadas ou a todos os recursos do aplicativo oficial só porque existe uma tela correspondente no cliente.

Se o código expirar, atualize o fluxo de QR code. Quando encerrar a experiência, remova a sessão na lista de aparelhos conectados do WhatsApp.

## Se alguma etapa falhar

- **O QR code não aparece:** confira os logs do serviço, caminho do Node, dependências instaladas e permissão de escrita em `sessions/`. Verifique se o app foi compilado com host, porta, protocolo e caminho da API corretos.
- **Funciona no computador, mas não no BlackBerry:** confira o acesso pela rede do celular, permissões do app, data e hora, confiança do certificado e compatibilidade TLS.
- **A instalação pelo JAD falha:** verifique se o JAR indicado está acessível, se seu tamanho corresponde ao descritor e se o aparelho aceita o perfil Java ME do aplicativo.
- **Conectou, mas faltam conversas:** aguarde a sincronização e teste uma mensagem de texto nova. Um cliente experimental vinculado pode não reproduzir todo o histórico ou os recursos oficiais.
- **O servidor para ao fechar o SSH:** use o serviço systemd e confira a pasta de trabalho, em vez de iniciar o binário apenas em um terminal interativo.

A parte mais legal é a primeira mensagem digitada naquele teclado físico. Com a ponte acessível, [configure sua compilação para BlackBerry na área de membros](https://members.lacorte.dev/pt/tools/whatsapp-j2me) e leve os arquivos de instalação para o celular.

Referências de implementação: [whatsapp-j2me](https://github.com/mateuslacorte/whatsapp-j2me), [baileys-j2me](https://github.com/mateuslacorte/baileys-j2me) e [Baileys](https://github.com/WhiskeySockets/Baileys), biblioteca usada pela ponte para se conectar ao WhatsApp. Os projetos podem mudar conforme o protocolo evolui.
