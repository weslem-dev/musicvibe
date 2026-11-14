import { onBeforeUnmount, onMounted } from 'vue'

// ADICIONADO NA AULA 09.
// Chama `callback` sempre que o usuário clica FORA do elemento apontado por
// `elementRef` (uma ref de template). É o que faz um menu suspenso fechar
// quando se clica em qualquer outro lugar da página.
//
// O listener fica no `document` (e não no elemento), porque um clique fora do
// elemento, por definição, nunca chega nele. Por isso é preciso REMOVER o
// listener quando o componente sai da tela (onBeforeUnmount): senão, cada vez
// que o componente fosse criado e destruído sobraria um listener "fantasma"
// no document, chamando um callback de um componente que não existe mais.
export function useClickOutside(elementRef, callback) {
  function handleDocumentClick(event) {
    const element = elementRef.value
    if (!element) return

    // contains() é true pro próprio elemento E pra qualquer descendente dele
    // (o botão que abre o menu, os itens...): clicar neles não é "fora".
    if (!element.contains(event.target)) {
      callback(event)
    }
  }

  onMounted(() => document.addEventListener('click', handleDocumentClick))
  onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
}
