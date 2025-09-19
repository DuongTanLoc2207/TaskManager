import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { normalizeBoard } from '~/utils/boardHelpers'
import { generatePlaceholderCard } from '~/utils/formatters'
import { cloneDeep, isEmpty } from 'lodash'
import { findCardInBoard, updateSubCardInTree } from '~/utils/cardUtils'

const initialState = {
  currentActiveBoard: null,
  isSubCardMode: false
}

export const fetchBoardDetailsAPI = createAsyncThunk(
  'activeBoard/fetchBoardDetailsAPI',
  async (boardId) => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/${boardId}`)
    return response.data
  }
)

export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  reducers: {
    updateCurrentActiveBoard: (state, action) => {
      const board = action.payload
      state.currentActiveBoard = board
    },
    updateCardInBoard: (state, action) => {
      const incomingCard = action.payload
      const newBoard = cloneDeep(state.currentActiveBoard)
      const cardToUpdate = findCardInBoard(newBoard, incomingCard._id)
      if (cardToUpdate) {
        Object.assign(cardToUpdate, incomingCard)
        if (incomingCard.parentCardId) {
          const parentCard = findCardInBoard(newBoard, incomingCard.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        state.currentActiveBoard = newBoard
      }
    },
    updateBoardInStore: (state, action) => {
      const board = action.payload
      state.currentActiveBoard = normalizeBoard(board)
    },
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
    },
    makeSubCardInBoard: (state, action) => {
      const { childCardId, parentCardId } = action.payload
      const newBoard = cloneDeep(state.currentActiveBoard)
      let childCard = null
      let sourceColumn = null
      for (const column of newBoard.columns) {
        const card = column.cards.find(c => c._id === childCardId)
        if (card) {
          childCard = card
          sourceColumn = column
          break
        }
      }

      if (childCard && sourceColumn) {
        sourceColumn.cards = sourceColumn.cards.filter(c => c._id !== childCardId)
        sourceColumn.cardOrderIds = sourceColumn.cardOrderIds.filter(id => id !== childCardId)
        if (isEmpty(sourceColumn.cards)) {
          sourceColumn.cards = [generatePlaceholderCard(sourceColumn)]
          sourceColumn.cardOrderIds = [sourceColumn.cards[0]._id]
        }

        let parentCard = null
        for (const column of newBoard.columns) {
          const card = column.cards.find(c => c._id === parentCardId)
          if (card) {
            parentCard = card
            break
          }
        }

        if (parentCard) {
          childCard.parentCard = parentCardId
          childCard.columnId = null

          parentCard.subCards = parentCard.subCards || []
          if (!parentCard.subCards.some(c => c._id === childCardId)) {
            parentCard.subCards.push(childCard)
          }
        }
      }

      state.currentActiveBoard = newBoard
    },
    setOverCardId(state, action) {
      state.overCardId = action.payload
    },
    setIsCtrlPressed(state, action) {
      state.isCtrlPressed = action.payload
    },
    toggleSubCardMode: (state) => {
      state.isSubCardMode = !state.isSubCardMode
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardDetailsAPI.pending, (state) => {
        state.currentActiveBoard = null
      })
      .addCase(fetchBoardDetailsAPI.fulfilled, (state, action) => {
        const board = action.payload
        state.currentActiveBoard = normalizeBoard(board)
      })
      .addCase(fetchBoardDetailsAPI.rejected, (state) => {
        state.currentActiveBoard = null
      })
  }
})

export const {
  updateCurrentActiveBoard,
  updateCardInBoard,
  updateBoardInStore,
  deleteCardFromBoard,
  makeSubCardInBoard,
  setOverCardId,
  setIsCtrlPressed,
  toggleSubCardMode
} = activeBoardSlice.actions

export const selectCurrentActiveBoard = (state) => {
  return state.activeBoard.currentActiveBoard
}

export const activeBoardReducer = activeBoardSlice.reducer