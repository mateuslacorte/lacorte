---
title: 'Script RouterOS pro BetterStack: por que eu fiz isso?'
date: '2026-01-10'
tags:
  - routeros
  - mikrotik
  - betterstack
  - logs
  - portfólio
description: >-
  Fiz um script RouterOS pra mandar logs pro BetterStack num momento
  completamente errado. Eu deveria ter descansado. Mas não descansei. E agora
  estou aqui escrevendo sobre isso.
---


Olá, queridos leitores. Hoje vou contar de um dos projetos mais desnecessários e exaustivos que já montei, num momento completamente errado. Sim, estamos falando de um script RouterOS pra enviar logs ao BetterStack. Empolgante, não é? *Não.*


## O timing poderia ser pior?


Deixa eu contextualizar a bagunça. Eu estava numa daquelas fases em que o humor depressivo resolveu aparecer, misturado com um cansaço absurdo que fazia qualquer tarefa simples parecer maratona. Aquele cansaço que não é físico, é mental — o tipo que te faz questionar por que você ainda está acordado mexendo em script RouterOS quando deveria estar dormindo.


Mas não. Em vez de simplesmente **desligar o computador e ir descansar** como qualquer pessoa sã faria, decidi que era o momento perfeito pra criar um script que manda logs do RouterOS pro BetterStack. Por quê? **Eu nem sei.** Sinceramente, olhando pra trás, não faço ideia do que passou pela minha cabeça. Talvez fosse procrastinação de algo importante. *Sim, era isso...* Talvez fosse o cansaço me convencendo de que isso era necessário. *Isso também...* Ou talvez fosse só meu cérebro deprimido tentando criar qualquer coisa pra se sentir útil. *Mesma coisa, só que diferente...*


## O projeto


O script em si é relativamente simples — e aqui está a ironia: eu poderia simplesmente ter *comprado* uma solução pronta ou usado algo que já existisse. Mas não. Meu cérebro cansado e deprimido decidiu que era hora de reinventar a roda e queimar a tarde inteira.


### O que o script faz


O script basicamente:


1. Pega os logs do RouterOS guardados na memória
2. Converte o formato de data do RouterOS (que é ridículo) pra um formato ISO legível
3. Processa cada log individualmente
4. Envia via HTTPS pro BetterStack usando curl
5. Faz tudo isso a cada 30 segundos porque sim


Parece útil, né? **Não é.** Pelo menos não naquele momento. Eu não estava em nenhum projeto que precisasse disso. Não tinha cliente pedindo. Não tinha urgência nenhuma. Era literalmente só meu cérebro cansado e deprimido inventando trabalho desnecessário pra mim mesmo.


## Análise do script: bloco por bloco


Agora deixa eu explicar como esse script realmente funciona. Porque se você vai sofrer lendo sobre isso, pelo menos entenda o que está acontecendo. Aviso justo: RouterOS Script é… especial. É como se alguém tivesse pegado uma linguagem de programação e removido todas as partes boas.


### Bloco 1: Limpeza (Linhas 6-10)


```routeros
:do { /system scheduler remove [find name="betterstack-sender"] } on-error={}
:do { /system script remove [find name="betterstack-sender"] } on-error={}
```


Essa é a seção de limpeza. Antes de criar qualquer coisa nova, removemos qualquer scheduler ou script existente com o mesmo nome. O `on-error={}` significa "se não existir, tudo bem, só continua." O RouterOS não tem um bom check de "se existe", então a gente simplesmente tenta remover e ignora os erros. Elegante, né? (Não.)


### Bloco 2: Variáveis globais (Linhas 12-16)


```routeros
:global betterstackToken "your-better-stack-token"
:global betterstackEndpoint "your-betterstack-endpoint-for-curl"
```


Aqui definimos as variáveis globais que serão usadas ao longo do script. Elas precisam ser configuradas na mão pelo usuário. O token é o token de fonte do BetterStack, e o endpoint é a URL de ingestão. Você configura isso manualmente porque o RouterOS não tem variável de ambiente nem um sistema de arquivo de configuração decente. Você só… define variável global. Bem-vindo ao RouterOS.


### Bloco 3: Função de conversão de data (Linhas 18-49)


```routeros
:global convertRouterOSDate do={
    :local routerOSDate $1
    :local formattedDate ""
    :local dateParts [:toarray $routerOSDate]
    
    :if ([:len $dateParts] >= 3) do={
        :local monthStr [:pick ($dateParts->0) 0 3]
        :local day ($dateParts->1)
        :local year ($dateParts->2)
        
        :local monthNum "01"
        :if ($monthStr = "jan") do={ :set monthNum "01" }
        :if ($monthStr = "feb") do={ :set monthNum "02" }
        # ... and so on for all months
        
        :set formattedDate ($year . "-" . $monthNum . "-" . $day)
    }
    
    :return $formattedDate
}
```


É aqui que a diversão começa. O RouterOS usa um formato de data tipo "jan/06/2026" que precisa virar "2026-01-06". Essa função:


1. Pega a string de data do RouterOS
2. Divide num array com `:toarray`
3. Extrai os 3 primeiros caracteres do mês (jan, feb, mar, etc.)
4. Mapeia cada abreviação de mês pro equivalente numérico com uma série de if (porque o RouterOS não tem switch/case nem dicionário)
5. Concatena tudo em formato ISO


Sim, tem 12 if separados. Não, não existe jeito melhor no RouterOS Script. Essa é a sua vida agora, aceite!


### Bloco 4: Script principal - verificação de configuração (Linhas 55-68)


```routeros
/system script add name="betterstack-sender" source={
    :global betterstackToken
    :global betterstackEndpoint
    :global convertRouterOSDate
    
    :if ($betterstackToken = "YOUR_BETTERSTACK_SOURCE_TOKEN") do={
        :return
    }
    
    :if ($betterstackEndpoint = "YOUR_BETTERSTACK_ENDPOINT") do={
        :return
    }
```


Esse é o começo do script principal. Primeiro, acessamos as variáveis globais que definimos antes. Depois checamos se foram configuradas. Se ainda tiverem valor placeholder, simplesmente retornamos cedo e não fazemos nada. É validação básica, mas é melhor do que nada — considerando que esses desgraçados somem depois de um reboot.


### Bloco 5: Buscando os logs (Linhas 70-74)


```routeros
:local logs [/log print as-value where buffer="memory"]
:local logCount [len $logs]
:local successCount 0
:local errorCount 0
```


Aqui buscamos todos os logs do buffer de memória. O RouterOS pode guardar logs em memória, e estamos pegando todos. Também inicializamos contadores pra rastrear quantos logs enviamos com sucesso e quantos falham.


### Bloco 6: Processando cada log - conversão de data (Linhas 77-133)


```routeros
:foreach log in=$logs do={
    :local logMessage ($log->"message")
    :local logTopics ($log->"topics")
    :local logTime ($log->"time")

    # Converts RouterOS date format to ISO format
    :local formattedDate ""
    :if ([:len $logTime] > 0) do={
        :local dateParts [:toarray $logTime]
        :if ([:len $dateParts] >= 3) do={
            :local monthStr [:pick ($dateParts->0) 0 3]
            :local day ($dateParts->1)
            :local year ($dateParts->2)
            
            # Month mapping (12 if statements...)
            :local monthNum "01"
            :if ($monthStr = "jan") do={ :set monthNum "01" }
            # ... all 12 months ...
            
            :set formattedDate ($year . "-" . $monthNum . "-" . $day)
        }
    }
    
    # Fallback to current date if conversion failed
    :if ([:len $formattedDate] = 0) do={
        :local currentDate [/system clock get date]
        # ... same conversion logic for current date ...
    }
}
```


Pra cada log, extraímos a mensagem, os tópicos e o timestamp. Depois convertemos o formato de data. Se a conversão falhar (porque os formatos de data do RouterOS são inconsistentes), caímos de volta pra data atual do sistema. Percebeu como temos que duplicar toda a lógica de mapeamento de meses? Pois é, o RouterOS Script não tem funções que você chame fácil de dentro de outras funções. É… especial.


### Bloco 7: Extração de horário (Linhas 135-150)


```routeros
:local logHour ""
:if ([:len $logTime] > 0) do={
    :local timeParts [:toarray $logTime]
    :if ([:len $timeParts] >= 2) do={
        :set logHour ($timeParts->1)
    }
}

:if ([:len $logHour] = 0) do={
    :set logHour [/system clock get time]
}

:local utcTimestamp ($formattedDate . " " . $logHour . " UTC")
```


Extraímos a parte do horário do timestamp. Se não der, usamos o horário atual do sistema. Depois juntamos data e horário numa string de timestamp UTC. Simples o bastante, mas de novo: muita manipulação manual de string porque o RouterOS não tem lib decente de data/hora.


### Bloco 8: Escape de JSON (Linhas 152-163)


```routeros
:local cleanMessage ""
:for i from=0 to=([:len $logMessage] - 1) do={
    :local char [:pick $logMessage $i ($i + 1)]
    :if ($char = "\"") do={ :set cleanMessage ($cleanMessage . "\\\"") } else={
        :if ($char = "\\") do={ :set cleanMessage ($cleanMessage . "\\\\") } else={
            :set cleanMessage ($cleanMessage . $char)
        }
    }
}
```


Esse é o pesadelo do escape de JSON. O RouterOS não tem biblioteca de JSON, então temos que escapar na mão os caracteres especiais. Iteramos caractere por caractere da mensagem e escapamos aspas e barras invertidas. Caractere por caractere porque o RouterOS não tem uma função `replace`. Sim, é tão tedioso quanto parece.


### Bloco 9: Construção do JSON e requisição HTTP (Linhas 165-177)


```routeros
:local jsonData "{\"dt\":\"$cleanTimestamp\",\"message\":\"$cleanMessage\"}"

:local authHeader "Content-Type: application/json,Authorization: Bearer $betterstackToken"

:do {
    /tool fetch http-method=post http-header-field="$authHeader" http-data="$jsonData" url="$betterstackEndpoint" keep-result=no check-certificate=no
    :set successCount ($successCount + 1)
} on-error={
    :set errorCount ($errorCount + 1)
}
```


Aqui montamos o payload JSON na mão (porque não tem lib de JSON) e enviamos via HTTP POST. O formato do header é… interessante. O RouterOS espera os headers como uma string separada por vírgulas, não campos separados. Desabilitamos a verificação de certificado porque a validação de certificado do RouterOS pode dar problema. Envolvemos tudo num try-catch (o bloco `:do { } on-error={}`) pra lidar com falha sem drama.


### Bloco 10: Reset do buffer (Linhas 180-185)


```routeros
:if ($successCount > 0) do={
    /system logging action set [find name=memory] memory-lines=1
    :delay 200ms
    /system logging action set [find name=memory] memory-lines=100
}
```


Depois de enviar os logs com sucesso, resetamos o buffer de memória. Fazemos isso configurando ele temporariamente pra 1 linha (o que limpa), esperando 200ms, depois voltando pra 100 linhas. É gambiarra, mas funciona. O RouterOS não tem um comando "limpar buffer", então a gente trabalha com o que tem.


### Bloco 11: Configuração do scheduler (Linhas 190-194)


```routeros
/system scheduler add \
    name="betterstack-sender" \
    start-time=startup \
    interval=30s \
    on-event="betterstack-sender"
```


Por fim, criamos um scheduler que roda o script a cada 30 segundos. Ele também roda na inicialização. Isso garante que os logs sejam enviados em lote com regularidade — exceto que não tem porra nenhuma de globals na inicialização. Sim, de novo… aqueles desgraçados somem depois de um reboot!


## Por que isso foi uma má ideia


Deixa eu deixar claro: **eu deveria ter descansado.** Ponto final. Não havia motivo nenhum pra estar criando esse script naquele momento. Era desnecessário, exaustivo, e só piorou o humor depressivo porque me fez sentir que estava queimando tempo e energia em coisa inútil.


Mas aqui está a ironia: agora estou aqui, escrevendo sobre isso no blog, como se fosse importante ou interessante. A vida é engraçada assim, né? (Não é.) E a pior parte é eu escrever esse post inútil pra caramba que ninguém vai ler, depois de fazer todo esse trabalho inútil pra algo que eu não preciso. Que momento incrível… Épico!


## O que eu deveria ter feito

1. **Desligar o computador**
2. **Ir dormir**
3. **Descansar**
4. **Fazer isso num dia melhor, se realmente fosse necessário**


Mas não. Eu fiz o script. Agora ele está aqui. E estou escrevendo sobre ele como se fosse conquista.


## A lição, se é que existe alguma

**Sim, descansar é importante.** Às vezes ficamos acordados achando que vamos ganhar mais XP assim. Às vezes isso só piora as coisas. Às vezes dormir também dá XP.


Eu deveria ter descansado. Eu não deveria ter feito esse script. Essa é a verdade…


E se alguém realmente precisar do script (o que duvido), ele está disponível. Mas por favor, use quando estiver descansado e com a cabeça no lugar. Não faça como eu e crie script desnecessário em momento errado quando você deveria estar dormindo.


---


O script está no [GitHub](https://github.com/mateuslacorte/betterstack-for-mikrotik) se você realmente precisar. Mas de novo: **você provavelmente não precisa.** E se precisar, vai descansar primeiro.
