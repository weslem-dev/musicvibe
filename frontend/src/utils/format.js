// ADICIONADO NA AULA 10. Formatadores de exibição (nada aqui fala com a API).

const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * "agora mesmo", "há 5 minutos", "há 3 horas", "ontem", "há 4 dias" e, depois
 * de uma semana, a data completa (17/10/2026). Recebe a data em ISO, como a
 * API devolve.
 */
export function formatRelativeTime(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''

  // Negativo = passado. Um pequeno adiantamento do relógio do servidor em
  // relação ao do navegador não pode virar "em 2 minutos".
  const seconds = Math.min(0, Math.round((date.getTime() - Date.now()) / 1000))
  const abs = Math.abs(seconds)

  if (abs < 45) return 'agora mesmo'
  if (abs < HOUR) return relativeFormatter.format(Math.round(seconds / MINUTE), 'minute')
  if (abs < DAY) return relativeFormatter.format(Math.round(seconds / HOUR), 'hour')
  if (abs < 7 * DAY) return relativeFormatter.format(Math.round(seconds / DAY), 'day')

  return formatDate(isoDate)
}

/** "17/10/2026" -- data curta no formato brasileiro. Um só lugar para formatar datas. */
export function formatDate(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('pt-BR')
}

/** "17/10/2026 10:21" -- usado no title (tooltip) do tempo relativo. */
export function formatDateTime(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** 999 -> "999"; 1200 -> "1,2 mil"; 1500000 -> "1,5 mi". */
export function formatCount(value) {
  const number = Number(value) || 0

  if (number < 1000) return String(number)

  if (number < 1_000_000) {
    return `${(number / 1000).toFixed(1).replace('.', ',').replace(',0', '')} mil`
  }

  return `${(number / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} mi`
}
