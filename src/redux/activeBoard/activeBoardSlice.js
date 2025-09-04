import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { normalizeBoard } from '~/utils/boardHelpers'
import { generatePlaceholderCard } from '~/utils/formatters'

// Khởi tạo giá trị State của Slice trong redux
const initialState = {
  currentActiveBoard: null
}

export const fetchBoardDetailsAPI = createAsyncThunk(
  'activeBoard/fetchBoardDetailsAPI',
  async (boardId) => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/${boardId}`)
    return response.data
  }
)

// Khởi tạo một Slice trong Redux Store
export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  // Reducers: nơi xử lý dữ liệu đồng bộ
  reducers: {
    updateCurrentActiveBoard: (state, action) => {
      const board = action.payload

      // Xử lý dữ liệu nếu cần thiết

      // Update lại dữ liệu của currentActiveBoard
      state.currentActiveBoard = board
    },
    updateCardInBoard: (state, action) => {
      // Update nested data
      const incomingCard = action.payload

      // Tìm dần từ board > column > card
      const coloumn = state.currentActiveBoard.columns.find(i => i._id === incomingCard.columnId)
      if (coloumn) {
        const card = coloumn.cards.find(i => i._id === incomingCard._id)
        if (card) {
          // card.title = incomingCard.title
          // card['title'] = incomingCard['title']
          Object.keys(incomingCard).forEach(key => {
            card[key] = incomingCard[key]
          })
        }
      }
    },
    // Reducer mới để update board sau khi thêm/xoá member
    updateBoardInStore: (state, action) => {
      const board = action.payload
      state.currentActiveBoard = normalizeBoard(board)
    },
    // Thêm action xóa card
    deleteCardFromBoard: (state, action) => {
      const { cardId, columnId } = action.payload
      const column = state.currentActiveBoard.columns.find(col => col._id === columnId)
      if (column) {
        column.cards = column.cards.filter(card => card._id !== cardId)
        column.cardOrderIds = column.cardOrderIds.filter(id => id !== cardId)
        if (!column.cards.length) {
          column.cards = [generatePlaceholderCard(column)]
          column.cardOrderIds = [column.cards[0]._id]
        }
      }
    }
  },

  // ExtraReducers: nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardDetailsAPI.pending, (state) => {
        // Reset về null ngay khi bắt đầu load board mới
        state.currentActiveBoard = null
      })
      .addCase(fetchBoardDetailsAPI.fulfilled, (state, action) => {
        const board = action.payload
        state.currentActiveBoard = normalizeBoard(board)
      })
      .addCase(fetchBoardDetailsAPI.rejected, (state) => {
        // Nếu lỗi cũng reset null
        state.currentActiveBoard = null
      })
  }
})

// Actions: cập nhật lại dữ liệu thông qua reducer (đồng bộ)
export const { updateCurrentActiveBoard, updateCardInBoard, updateBoardInStore, deleteCardFromBoard } = activeBoardSlice.actions

// Selectors: lấy dữ liệu trong redux store
export const selectCurrentActiveBoard = (state) => {
  return state.activeBoard.currentActiveBoard
}

// export default activeBoardSlice.reducer
export const activeBoardReducer = activeBoardSlice.reducer