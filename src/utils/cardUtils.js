// Tìm card bằng id trong toàn board (traverse columns và subcards recursive)
export const findCardInBoard = (board, cardId) => {
  for (const column of board.columns) {
    for (const card of column.cards) {
      if (card._id === cardId) return card
      const foundInSub = findCardInTree(card.subCards || [], cardId)
      if (foundInSub) return foundInSub
    }
  }
  return null
}

// Tìm card trong tree subcards (recursive)
export const findCardInTree = (subCards, cardId) => {
  for (const card of subCards) {
    if (card._id === cardId) return card
    const found = findCardInTree(card.subCards || [], cardId)
    if (found) return found
  }
  return null
}

// Update subcard trong tree (recursive, trả về tree mới)
export const updateSubCardInTree = (subCards, updatedCard) => {
  return subCards.map(card => {
    if (card._id === updatedCard._id) {
      return { ...card, ...updatedCard }
    }
    if (card.subCards) {
      return { ...card, subCards: updateSubCardInTree(card.subCards, updatedCard) }
    }
    return card
  })
}

export const removeSubCardFromTree = (subCards, cardId) => {
  return (subCards || []).filter(sub => {
    if (sub._id === cardId) return false
    sub.subCards = removeSubCardFromTree(sub.subCards, cardId)
    return true
  })
}

// Hàm đệ quy để tìm tổ tiên trong cây subCards
const findAncestorInTree = (subCards, cardId, currentAncestors) => {
  for (const subCard of subCards) {
    if (subCard._id === cardId) {
      return currentAncestors
    }
    if (subCard.subCards) {
      const found = findAncestorInTree(subCard.subCards, cardId, [...currentAncestors, subCard._id])
      if (found) {
        return found
      }
    }
  }
  return null
}

// Tìm tất cả tổ tiên của một card (từ immediate parent đến top-level parent)
export const findCardAncestors = (board, cardId) => {
  const ancestors = []

  // Duyệt qua columns để tìm card
  for (const column of board.columns) {
    for (const card of column.cards) {
      if (card._id === cardId) {
        // Nếu card là top-level card, không có parent
        return ancestors
      }
      if (card.subCards) {
        const foundInSub = findAncestorInTree(card.subCards, cardId, [card._id])
        if (foundInSub) {
          return [...ancestors, ...foundInSub]
        }
      }
    }
  }
  return ancestors
}

// Tính tổng số sub-card trong cây (recursive)
export const countSubCardsInTree = (subCards) => {
  if (!Array.isArray(subCards) || subCards.length === 0) return 0
  return subCards.length + subCards.reduce((total, sub) => total + countSubCardsInTree(sub.subCards), 0)
}