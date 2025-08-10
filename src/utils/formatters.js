// Capitalize the first letter of a string
export const capitalizeFirstLetter = (val) => {
  if (!val) return ''
  return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}

// Fix bug khi column rỗng, FE tạo một card đặc biệt không liên quan BE, đc ẩn ở UI và mỗi column chỉ có thể có tối đa một Card này theo cấu trúc dưới đây
export const generatePlaceholderCard = (column) => {
  return {
    _id: `${column._id}-placeholder-card`,
    boardId: column.boardId,
    columnId: column._id,
    FE_PlaceholderCard: true
  }
}