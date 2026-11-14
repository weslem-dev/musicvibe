# Respostas — Atividade 12

**1. Por que `useAsyncData` recebe `() => minhaChamada()` e não `minhaChamada()`**
`minhaChamada()` dispara a requisição na hora em que a linha é lida e entrega só o resultado (uma Promise), então o composable receberia algo que já está em andamento e não teria como repetir a chamada. Recebendo uma função, ele decide quando chamar: ao criar a tela, quando o parâmetro da rota mudar (`watch`) ou quando a tela pedir para tentar de novo.

**2. O que é a corrida entre respostas, como aparece para o usuário e como o `lastCallId` a evita**
Quando o usuário troca de perfil ou de faixa rápido, duas requisições ficam em voo e a mais antiga pode terminar depois da nova. Sem proteção, ela sobrescreve a tela e o usuário vê os dados da pessoa anterior, com a URL da nova. O `lastCallId` dá um número a cada chamada e só deixa escrever na tela a resposta cujo número ainda é o último; a atrasada é descartada.

**3. Quem avisa o usuário quando uma ação, uma leitura e um formulário falham, e por que "toast para todo erro" seria um erro de design**
Ação que falha (curtir, seguir, excluir, comentar) é avisada pelo interceptor do Axios, com um toast, salvo `silent`. Leitura que falha é da tela, que mostra o `error` do `useAsyncData`. Formulário que falha mostra o erro no próprio formulário (por isso `silent: true` nos services dele). Toast para todo erro duplicaria avisos que a tela já dá, encheria a tela a cada GET que falhasse e afastaria o erro do lugar onde a pessoa está olhando.

**4. Por que a lista de toasts fica fora da função `useToast()` e a vantagem sobre uma store do Pinia**
O arquivo é executado uma vez, então a lista existe uma vez só e todos que chamam `useToast()` (o `ToastContainer` e o interceptor do `api.js`) enxergam a mesma. Neste caso, a vantagem sobre uma store é que o `api.js` não é um componente e a store de autenticação já importa o `api`: importar uma store de volta criaria uma dependência circular. O módulo comum não precisa de `createPinia` nem de contexto do Vue.

**5. Por que `?limit=-3` era um problema, por que `Number.parseInt('abc') >= 1` dá `false` (e a utilidade disso) e por que existe um teto**
Sem tratamento, `?limit=-3` ou `?page=-2` chegariam ao banco como `LIMIT` e `OFFSET` negativos, o que dá erro de SQL (500), e `?limit=100000` pediria a tabela inteira. `Number.parseInt('abc')` dá `NaN`, e `NaN >= 1` é `false`: a mesma comparação recusa de uma vez o que falta, o que não é número, o zero e os negativos, que caem no valor padrão. O teto (`MAX_LIMIT`, 50) impede o cliente de pedir tudo de uma vez e sobrecarregar o banco.

**6. Por que o miolo da atualização otimista não foi extraído hoje e o que é a "regra dos três"**
Só existem duas cópias do miolo (curtir e seguir), e elas diferem no que importa: um guarda estado e contador no próprio componente, o outro usa dois `v-model` do pai. Pela regra dos três, só se extrai na terceira repetição, quando já dá para ver o que é igual de verdade; extrair com duas cópias arrisca uma abstração com o formato errado, mais cara de desfazer do que a duplicação.

**7. O que pode dar errado quando um Service grava o registro e o contador do autor sem transação**
Uma falha entre as duas escritas deixa o banco inconsistente: a faixa existe, mas o `tracksCount` não subiu. No MusicVibe piorava, porque o `errorHandler` apaga os arquivos da requisição que falhou, deixando a faixa gravada apontando para arquivos que não existem. Na transação, as duas escritas valem juntas ou nenhuma vale; no meu teste, com o contador falhando, o código antigo deixou a faixa no banco e o novo desfez tudo.

## Extra: o experimento da corrida (passo 20, opcional)

Simulei a corrida num teste automatizado: o perfil de `pedro` responde com 900 ms de atraso e o de `maju.soares` responde na hora. O usuário abre `pedro` e, logo em seguida, `maju.soares`. Com o `lastCallId`, a tela terminou mostrando **Maria Julia** e continuou assim mesmo depois que a resposta atrasada de `pedro` chegou. Quando removi o `lastCallId` do composable, a mesma sequência terminou com **Pedro Silva** na tela, enquanto a URL era a de `maju.soares`: é exatamente o problema que o `lastCallId` evita.
