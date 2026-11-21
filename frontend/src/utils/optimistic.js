// ADICIONADO NA AULA 13. O "miolo" da atualização otimista, extraído no
// TERCEIRO caso (curtir, seguir e marcar uma playlist no modal "Salvar"). Com
// três cópias já dá para ver o que é igual de verdade -- a regra dos três.
//
// O que é IGUAL nos três: mudar a tela antes, chamar a API, adotar a resposta
// no sucesso e desfazer no erro. O que MUDA em cada um: o que é alterado na tela,
// qual chamada é feita e o que se aproveita da resposta. Por isso o utilitário
// recebe essas três partes como funções:
//
//   apply()          muda a tela NA HORA e DEVOLVE a função que desfaz a mudança.
//                    Quem sabe desfazer é quem fez: só o apply viu o estado de antes.
//   request()        dispara a chamada e devolve a promessa.
//   confirm(data)    no sucesso, adota o que o servidor disse (a fonte da verdade).
//
// No erro, só desfaz: sem if e sem toast, porque o interceptor do Axios já
// avisou o usuário (é uma AÇÃO que falhou).
export async function runOptimistic({ apply, request, confirm }) {
  const undo = apply()

  try {
    const response = await request()
    confirm?.(response.data)
    return response
  } catch {
    undo()
    return null
  }
}
