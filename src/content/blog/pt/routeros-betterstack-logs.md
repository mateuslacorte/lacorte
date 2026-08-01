---
title: 'Script RouterOS Para o BetterStack: Por Que Eu Fiz Isso?'
date: '2026-01-10'
tags:
  - routeros
  - mikrotik
  - betterstack
  - logs
  - portfólio
description: >-
  Criei um script RouterOS para enviar logs ao BetterStack num momento
  completamente inoportuno. Eu deveria ter descansado. Mas não descansei. E
  agora estou aqui escrevendo sobre isso.
---


Olá, queridos leitores. Hoje vou contar sobre um dos projetos mais desnecessários e exaustivos que já criei, num momento completamente errado. Sim, estamos falando de um script RouterOS para enviar logs ao BetterStack. Empolgante, não é? *Não.*


## O Timing Poderia Ser Pior?


Deixa eu contextualizar a bagunça que eu fiz. Eu estava passando por uma daquelas fases em que o humor depressivo decidiu aparecer, combinado com um cansaço absurdo que fazia qualquer tarefa simples parecer uma maratona. Aquele tipo de cansaço que não é físico, mas mental — aquele cansaço que te faz questionar por que você ainda está acordado mexendo em scripts RouterOS quando deveria estar dormindo.


Mas não. Em vez de simplesmente **desligar o computador e ir descansar** como qualquer pessoa sã faria, decidi que era o momento perfeito para criar um script que envia logs do RouterOS para o BetterStack. Por quê? **Eu nem sei.** Sinceramente, olhando para trás, não faço ideia do que se passou pela minha cabeça. Talvez fosse uma forma de procrastinar algo importante. *Sim, era isso...* Talvez fosse o cansaço me fazendo acreditar que isso era necessário. *Isso também...* Ou talvez fosse só meu cérebro deprimido tentando criar qualquer coisa para se sentir útil. *Mesma coisa, só que diferente...*


## O Projeto


O script em si é relativamente simples — e aqui está a ironia: eu poderia simplesmente ter *comprado* uma solução pronta ou usado algo que já existisse. Mas não. Meu cérebro cansado e deprimido decidiu que era hora de reinventar a roda e desperdiçar minha tarde toda.


### O Que o Script Faz


O script basicamente:


1. Pega os logs do RouterOS armazenados na memória
2. Converte o formato de data do RouterOS (que é ridículo) para um formato ISO legível
3. Processa cada log individualmente
4. Envia via HTTPS para o BetterStack usando curl
5. Faz tudo isso a cada 30 segundos porque sim


Parece útil, né? **Não é.** Pelo menos não nesse momento. Eu não estava trabalhando em nenhum projeto que precisasse disso. Não tinha nenhum cliente pedindo isso. Não tinha nenhuma necessidade urgente. Era literalmente só meu cérebro cansado e deprimido criando trabalho desnecessário para mim mesmo.


## Análise do Script: Bloco por Bloco


Agora, deixa eu explicar como esse script realmente funciona. Porque se você vai sofrer lendo sobre isso, é bom que entenda o que está acontecendo. Aviso justo: o RouterOS Script é... especial. É como se alguém tivesse pegado uma linguagem de programação e removido todas as partes boas.


### Bloco 1: Limpeza (Linhas 6-10)


```routeros
:do { /system scheduler remove [find name="betterstack-sender"] } on-error={}
:do { /system script remove [find name="betterstack-sender"] } on-error={}
```


Essa é a seção de limpeza. Antes de criar qualquer coisa nova, removemos qualquer scheduler ou script existente com o mesmo nome. O `on-error={}` significa "se não existir, tudo bem, só continua." O RouterOS não tem um bom check de "se existe", então a gente simplesmente tenta remover e ignora os erros. Elegante, né? (Não.)


### Bloco 2: Variáveis Globais (Linhas 12-16)


```routeros
:global betterstackToken "your-better-stack-token"
:global betterstackEndpoint "your-betterstack-endpoint-for-curl"
```


Aqui definimos as variáveis globais que serão usadas ao longo do script. Elas precisam ser configuradas manualmente pelo usuário. O token é o seu token de fonte do BetterStack, e o endpoint é a sua URL de ingestão do BetterStack. Você tem que configurar isso manualmente porque o RouterOS não tem variáveis de ambiente nem um sistema de arquivo de configuração legal. Você só... define variáveis globais. Bem-vindo ao RouterOS.


### Bloco 3: Função de Conversão de Data (Linhas 18-49)


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


É aqui que a diversão começa. O RouterOS usa um formato de data tipo "jan/06/2026" que precisa ser convertido para "2026-01-06". Essa função:


1. Pega a string de data do RouterOS
2. Divide ela num array usando `:toarray`
3. Extrai os 3 primeiros caracteres do mês (jan, feb, mar, etc.)
4. Mapeia cada abreviação de mês para o equivalente numérico usando uma série de if statements (porque o RouterOS não tem switch/case nem dicionários)
5. Concatena tudo em formato ISO


Sim, tem 12 if statements separados. Não, não existe uma forma melhor no RouterOS Script. Essa é a sua vida agora, aceite!


### Bloco 4: Script Principal - Verificação de Configuração (Linhas 55-68)


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


Esse é o começo do script principal. Primeiro, acessamos as variáveis globais que definimos antes. Depois checamos se elas foram configuradas. Se ainda tiverem valores placeholder, simplesmente retornamos cedo e não fazemos nada. É uma validação básica, mas é melhor do que nada, considerando que esses desgraçados somem depois de um reboot.


### Bloco 5: Buscando os Logs (Linhas 70-74)


```routeros
:local logs [/log print as-value where buffer="memory"]
:local logCount [len $logs]
:local successCount 0
:local errorCount 0
```


Aqui buscamos todos os logs do buffer de memória. O RouterOS pode armazenar logs em memória, e estamos pegando todos eles. Também inicializamos contadores para rastrear quantos logs enviamos com sucesso e quantos falham.


### Bloco 6: Processando Cada Log - Conversão de Data (Linhas 77-133)


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


Para cada log, extraímos a mensagem, os tópicos e o timestamp. Depois convertemos o formato de data. Se a conversão falhar (porque os formatos de data do RouterOS são inconsistentes), caímos de volta para usar a data atual do sistema. Percebeu como temos que duplicar toda a lógica de mapeamento de meses? Pois é, o RouterOS Script não tem funções que você possa chamar facilmente de dentro de outras funções. É... especial.


### Bloco 7: Extração de Horário (Linhas 135-150)


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


Extraímos a parte do horário do timestamp. Se não conseguirmos extrair, usamos o horário atual do sistema. Depois combinamos data e horário numa string de timestamp UTC. Simples o suficiente, mas de novo, muita manipulação manual de strings porque o RouterOS não tem boas bibliotecas de data/hora.


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


Esse é o pesadelo do escape de JSON. O RouterOS não tem uma biblioteca de JSON, então temos que escapar manualmente os caracteres especiais. Iteramos por cada caractere da mensagem de log e escapamos aspas e barras invertidas. Isso é feito caractere por caractere porque o RouterOS não tem uma função `replace`. Sim, isso é tão tedioso quanto parece.


### Bloco 9: Construção do JSON e Requisição HTTP (Linhas 165-177)


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


Aqui construímos o payload JSON manualmente (porque não tem biblioteca de JSON) e enviamos via HTTP POST. O formato do header é... interessante. O RouterOS espera os headers como uma string separada por vírgulas, não campos de header separados. Desabilitamos a verificação de certificado porque a validação de certificado do RouterOS pode dar problema. Envolvemos tudo num try-catch (o bloco `:do { } on-error={}`) para lidar com falhas de forma tranquila.


### Bloco 10: Reset do Buffer (Linhas 180-185)


```routeros
:if ($successCount > 0) do={
    /system logging action set [find name=memory] memory-lines=1
    :delay 200ms
    /system logging action set [find name=memory] memory-lines=100
}
```


Depois de enviar os logs com sucesso, resetamos o buffer de memória. Fazemos isso configurando ele temporariamente para 1 linha (o que limpa ele), esperando 200ms, depois configurando de volta para 100 linhas. É uma gambiarra, mas funciona. O RouterOS não tem um comando "limpar buffer", então trabalhamos com o que temos.


### Bloco 11: Configuração do Scheduler (Linhas 190-194)


```routeros
/system scheduler add \
    name="betterstack-sender" \
    start-time=startup \
    interval=30s \
    on-event="betterstack-sender"
```


Finalmente, criamos um scheduler que roda o script a cada 30 segundos. Ele também roda na inicialização. Isso garante que os logs sejam enviados regularmente em lotes, exceto que não tem porra nenhuma de globals na inicialização. Sim, de novo... aqueles desgraçados somem depois de um reboot!


## Por Que Isso Foi Uma Má Ideia


Deixa eu deixar claro: **eu deveria ter descansado.** Ponto final. Não havia razão nenhuma para estar criando esse script naquele momento. Era desnecessário, exaustivo, e só piorou meu humor depressivo porque me fez sentir que estava desperdiçando tempo e energia em algo inútil.


Mas aqui está a ironia: agora estou aqui, escrevendo sobre isso no meu blog, como se fosse importante ou interessante. A vida é engraçada assim, né? (Não é.) E a pior parte é eu escrever esse post inútil pra caramba que ninguém vai ler, depois de fazer todo esse trabalho inútil para algo que eu não preciso. Que momento incrível... Épico!


## O Que Eu Deveria Ter Feito

1. **Desligar o computador**
2. **Ir dormir**
3. **Descansar**
4. **Fazer isso em um dia melhor, se realmente fosse necessário**


Mas não. Eu fiz o script. Agora ele está aqui. E estou escrevendo sobre ele como se fosse uma conquista.


## A Lição Se É Que Existe Alguma


**Sim, descansar é importante.** Às vezes, ficamos acordados achando que vamos ganhar mais XP assim. Às vezes, isso só piora as coisas. Às vezes, dormir também dá XP.


Eu deveria ter descansado. Eu não deveria ter feito esse script. Essa é a verdade...


E se alguém realmente precisar do script (o que duvido), ele está disponível. Mas por favor, use quando estiver descansado e com a cabeça no lugar certo. Não faça como eu e crie scripts desnecessários em momentos inoportunos quando você deveria estar dormindo.


---


O script está disponível no [GitHub](https://github.com/mateuslacorte/betterstack-for-mikrotik) se você realmente precisar dele. Mas de novo: **você provavelmente não precisa dele.** E se precisar, vá descansar primeiro.
