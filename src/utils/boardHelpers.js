import { mapOrder } from '~/utils/sorts'
import { generatePlaceholderCard } from '~/utils/formatters'
import { isEmpty } from 'lodash'

export const normalizeBoard = (board) => {
  if (!board || !board.owners || !board.members || !board.columns) return board

  // Gộp owners + members → FE_allUsers
  board.FE_allUsers = board.owners.concat(board.members)

  // Sắp xếp columns theo columnOrderIds
  board.columns = mapOrder(board.columns, board.columnOrderIds, '_id')

  // Xử lý cards trong mỗi column
  board.columns.forEach(column => {
    column.cards = column.cards || []
    column.cardOrderIds = column.cardOrderIds || []

    // Lọc ra card thật (không phải placeholder)
    const realCards = column.cards.filter(card => !card.FE_isPlaceholder)

    if (isEmpty(realCards)) {
      const placeholder = generatePlaceholderCard(column)
      column.cards = [placeholder]
      column.cardOrderIds = [placeholder._id]
    } else {
      column.cards = mapOrder(realCards, column.cardOrderIds, '_id')
    }
  })

  return board
}
