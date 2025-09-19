import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentActiveCard: null,
  isShowModalActiveCard: false
}

export const activeCardSlice = createSlice({
  name: 'activeCard',
  initialState,
  reducers: {
    showModalActiveCard: (state) => {
      state.isShowModalActiveCard = true
    },
    clearAndHideCurrentActiveCard: (state) => {
      state.currentActiveCard = null
      state.isShowModalActiveCard = false
    },
    updateCurrentActiveCard: (state, action) => {
      state.currentActiveCard = action.payload
    },
    updateSubCardsInActiveCard: (state, action) => {
      const { subCard } = action.payload
      if (state.currentActiveCard) {
        state.currentActiveCard.subCards = state.currentActiveCard.subCards || []
        const subCardIndex = state.currentActiveCard.subCards.findIndex(c => c._id === subCard._id)
        if (subCardIndex >= 0) {
          state.currentActiveCard.subCards[subCardIndex] = subCard
        } else {
          state.currentActiveCard.subCards.push(subCard)
        }
      }
    }
  },
  // eslint-disable-next-line no-unused-vars
  extraReducers: (builder) => {}
})

export const {
  clearAndHideCurrentActiveCard,
  updateCurrentActiveCard,
  showModalActiveCard,
  updateSubCardsInActiveCard
} = activeCardSlice.actions

export const selectCurrentActiveCard = (state) => {
  return state.activeCard.currentActiveCard
}

export const selectIsShowModalActiveCard = (state) => {
  return state.activeCard.isShowModalActiveCard
}

export const activeCardReducer = activeCardSlice.reducer
