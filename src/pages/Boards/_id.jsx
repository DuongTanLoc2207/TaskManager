import { socketIoInstance } from '~/socketClient'
import { useEffect, useRef } from 'react'
import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
import {
  updateBoardDetailsAPI,
  updateColumnDetailsAPI,
  moveCardToDifferentColumnAPI
} from '~/apis'
import { cloneDeep, isEmpty } from 'lodash'
import {
  fetchBoardDetailsAPI,
  updateCurrentActiveBoard,
  selectCurrentActiveBoard
} from '~/redux/activeBoard/activeBoardSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import ActiveCard from '~/components/Modal/ActiveCard/ActiveCard'
import { generatePlaceholderCard } from '~/utils/formatters'
import { deleteCardFromBoard } from '~/redux/activeBoard/activeBoardSlice'
import { updateCurrentActiveCard, clearAndHideCurrentActiveCard, selectCurrentActiveCard, selectIsShowModalActiveCard } from '~/redux/activeCard/activeCardSlice'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { makeSubCardInBoard } from '~/redux/activeBoard/activeBoardSlice'
import { findCardInBoard, updateSubCardInTree, removeSubCardFromTree, findCardAncestors } from '~/utils/cardUtils'

function Board() {
  const dispatch = useDispatch()
  const board = useSelector(selectCurrentActiveBoard)
  const currentUser = useSelector(selectCurrentUser)
  const currentUserId = currentUser?._id
  const activeCard = useSelector(selectCurrentActiveCard)
  const isShowModalActiveCard = useSelector(selectIsShowModalActiveCard)

  const isShowModalActiveCardRef = useRef(isShowModalActiveCard)

  useEffect(() => {
    isShowModalActiveCardRef.current = isShowModalActiveCard
  }, [isShowModalActiveCard])

  const navigate = useNavigate()

  const { boardId } = useParams()
  const activeCardRef = useRef(activeCard)

  useEffect(() => {
    activeCardRef.current = activeCard
  }, [activeCard])

  useEffect(() => {
    dispatch(fetchBoardDetailsAPI(boardId))
  }, [dispatch, boardId])

  useEffect(() => {
    if (board?._id) {
      socketIoInstance.emit('FE_JOIN_BOARD', board._id)
    }

    socketIoInstance.on('BE_COLUMN_CREATED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      newBoard.columns.push(data.createdColumn)
      newBoard.columnOrderIds.push(data.createdColumn._id)
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_COLUMN_MOVED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      newBoard.columns = data.columnOrderIds.map(id =>
        newBoard.columns.find(col => col._id === id) || {}
      ).filter(col => col._id)
      newBoard.columnOrderIds = data.columnOrderIds
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_COLUMN_DELETED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      newBoard.columns = newBoard.columns.filter(c => c._id !== data.columnId)
      newBoard.columnOrderIds = newBoard.columnOrderIds.filter(_id => _id !== data.columnId)
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_CARD_CREATED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(col => col._id === data.createdCard.columnId)
      if (columnToUpdate) {
        if (columnToUpdate.cards.some(card => card.FE_PlaceholderCard)) {
          columnToUpdate.cards = [data.createdCard]
          columnToUpdate.cardOrderIds = [data.createdCard._id]
        } else {
          columnToUpdate.cards.push(data.createdCard)
          columnToUpdate.cardOrderIds.push(data.createdCard._id)
        }
      }
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_CARD_MOVED_IN_COLUMN', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const targetColumn = newBoard.columns.find(c => c._id === data.columnId)
      if (targetColumn) {
        targetColumn.cards = data.cardOrderIds.map(cardId =>
          targetColumn.cards.find(card => card._id === cardId) || { _id: cardId }
        ).filter(card => card._id)
        targetColumn.cardOrderIds = data.cardOrderIds
      }
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_CARD_MOVED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)

      const prevColumn = newBoard.columns.find(c => c._id === data.prevColumnId)
      if (prevColumn) {
        prevColumn.cards = data.prevCardOrderIds.map(cardId =>
          prevColumn.cards.find(card => card._id === cardId) || { _id: cardId }
        ).filter(card => card._id)
        prevColumn.cardOrderIds = data.prevCardOrderIds
        if (isEmpty(prevColumn.cards)) {
          prevColumn.cards = [generatePlaceholderCard(prevColumn)]
          prevColumn.cardOrderIds = [prevColumn.cards[0]._id]
        }
      }

      const nextColumn = newBoard.columns.find(c => c._id === data.nextColumnId)
      if (nextColumn) {
        nextColumn.cards = data.nextCardOrderIds.map(cardId => {
          if (cardId === data.currentCardId) {
            return { ...data.cardData, columnId: data.nextColumnId }
          }
          return nextColumn.cards.find(card => card._id === cardId) || { _id: cardId }
        }).filter(card => card._id)
        nextColumn.cardOrderIds = data.nextCardOrderIds
      }

      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_CARD_MADE_SUBCARD', (data) => {
      if (data.boardId !== board._id) return
      dispatch(makeSubCardInBoard({
        childCardId: data.childCardId,
        parentCardId: data.parentCardId
      }))
      if (activeCardRef.current?._id === data.parentCardId) {
        dispatch(updateCurrentActiveCard({
          ...activeCardRef.current,
          subCards: [...(activeCardRef.current.subCards || []), data.cardData]
        }))
      }
    })

    socketIoInstance.on('BE_SUBCARD_DELETED', (data) => {
      if (!board?._id || data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const column = newBoard.columns.find(col =>
        col.cards.some(card => card._id === data.parentCardId)
      )
      if (!column) {
        return
      }

      const parentCard = column.cards.find(c => c._id === data.parentCardId)
      if (!parentCard) {
        return
      }

      parentCard.subCards = removeSubCardFromTree(parentCard.subCards, data.cardId)
      dispatch(updateCurrentActiveBoard(newBoard))

      if (activeCardRef.current?._id === data.parentCardId) {
        const updatedParentCard = findCardInBoard(newBoard, data.parentCardId)
        if (updatedParentCard) {
          toast.info('A sub-card has been deleted by another user!')
          dispatch(updateCurrentActiveCard(cloneDeep(updatedParentCard)))
        }
      }

      if (activeCardRef.current?._id === data.cardId) {
        toast.error('Sub-card has been deleted by another user!')
        dispatch(clearAndHideCurrentActiveCard())
      }
    })


    socketIoInstance.on('BE_COLUMN_UPDATED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(col => col._id === data.columnId)
      if (columnToUpdate) {
        columnToUpdate.title = data.newTitle
      }
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_CARD_UPDATED', (data) => {
      if (!board?._id || data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (!cardToUpdate) {
        toast.error('Card not found:', data.cardId)
        return
      }
      cardToUpdate.title = data.newTitle
      if (data.parentCardId) {
        const parentCard = findCardInBoard(newBoard, data.parentCardId)
        if (parentCard) {
          parentCard.subCards = updateSubCardInTree(parentCard.subCards, { ...cardToUpdate, title: data.newTitle })
        } else {
          toast.error('Parent card not found:', data.parentCardId)
        }
      }
      dispatch(updateCurrentActiveBoard(newBoard))
      if (activeCardRef.current?._id === data.cardId && isShowModalActiveCardRef.current) {
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, title: data.newTitle }))
      }

      const ancestorCardIds = findCardAncestors(newBoard, data.cardId)
      if (ancestorCardIds.includes(activeCardRef.current?._id) && isShowModalActiveCardRef.current) {
        const updatedParentCard = findCardInBoard(newBoard, activeCardRef.current._id)
        if (updatedParentCard) {
          dispatch(updateCurrentActiveCard(cloneDeep(updatedParentCard)))
        }
      }
    })

    socketIoInstance.on('BE_CARD_DELETED', (data) => {
      if (data.boardId !== board._id) return
      dispatch(deleteCardFromBoard({
        cardId: data.cardId,
        columnId: data.columnId
      }))
      dispatch(clearAndHideCurrentActiveCard())
    })

    socketIoInstance.on('BE_BOARD_UPDATED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      newBoard.title = data.newTitle
      newBoard.description = data.newDescription || newBoard.description
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_BOARD_DELETED', (data) => {
      if (data.boardId !== board._id) return
      toast.error('Board has been deleted by another user!')
      dispatch(clearAndHideCurrentActiveCard())
      dispatch(updateCurrentActiveBoard(null))
      navigate('/boards')
    })

    socketIoInstance.on('BE_COMMENT_ADDED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.comments = [data.comment, ...(cardToUpdate.comments || [])]
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            comments: [data.comment, ...(activeCardRef.current.comments || [])]
          }))
        }
      }
    })


    socketIoInstance.on('BE_COMMENT_DELETED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.comments = cardToUpdate.comments.filter(c => c._id !== data.commentId)
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            comments: cardToUpdate.comments
          }))
        }
      }
    })

    socketIoInstance.on('BE_ATTACHMENT_ADDED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.attachments = [...(cardToUpdate.attachments || []), ...data.attachments]
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            attachments: cardToUpdate.attachments
          }))
        }
      }
    })

    socketIoInstance.on('BE_ATTACHMENT_DELETED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.attachments = cardToUpdate.attachments.filter(att => att.url !== data.attachmentUrl)
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            attachments: cardToUpdate.attachments
          }))
        }
      }
    })

    socketIoInstance.on('BE_CARD_COVER_ADDED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.cover = data.cover
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            cover: data.cover
          }))
        }
      }
    })

    socketIoInstance.on('BE_CARD_COVER_REMOVED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.cover = null
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            cover: null
          }))
        }
      }
    })

    socketIoInstance.on('BE_CARD_MEMBERS_UPDATED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.memberIds = data.memberIds
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            memberIds: data.memberIds
          }))
        }
      }
    })

    socketIoInstance.on('BE_USER_REMOVED_FROM_BOARD', (data) => {
      if (data.boardId !== board._id) return
      const { userId, isSelf, message } = data
      if (userId === currentUserId && !isSelf) {
        toast.info(message || 'You have been removed from the board!')
        dispatch(clearAndHideCurrentActiveCard())
        dispatch(updateCurrentActiveBoard(null))
        navigate('/boards')
      } else {
        const newBoard = cloneDeep(board)
        newBoard.FE_allUsers = newBoard.FE_allUsers.filter(user => user._id !== userId)
        dispatch(updateCurrentActiveBoard(newBoard))
      }
    })

    socketIoInstance.on('BE_USER_ADDED_TO_BOARD', (data) => {
      if (!board || data.boardId !== board._id) return
      const { user } = data
      const newBoard = cloneDeep(board)
      newBoard.FE_allUsers = newBoard.FE_allUsers || []
      if (!newBoard.FE_allUsers.some(u => u._id === user._id)) {
        newBoard.FE_allUsers = [...newBoard.FE_allUsers, user]
        dispatch(updateCurrentActiveBoard(newBoard))
      }
    })

    socketIoInstance.on('BE_CARD_DESCRIPTION_UPDATED', (data) => {
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const cardToUpdate = findCardInBoard(newBoard, data.cardId)
      if (cardToUpdate) {
        cardToUpdate.description = data.newDescription
        if (data.parentCardId) {
          const parentCard = findCardInBoard(newBoard, data.parentCardId)
          if (parentCard) {
            parentCard.subCards = updateSubCardInTree(parentCard.subCards, cardToUpdate)
          }
        }
        dispatch(updateCurrentActiveBoard(newBoard))
        if (activeCardRef.current?._id === data.cardId) {
          dispatch(updateCurrentActiveCard({
            ...activeCardRef.current,
            description: data.newDescription
          }))
        }
      }
    })

    socketIoInstance.on('BE_USER_AVATAR_UPDATED', (data) => {
      const newBoard = cloneDeep(board)
      const userToUpdate = newBoard.FE_allUsers?.find(user => user._id === data.userId)
      if (userToUpdate) {
        userToUpdate.avatar = data.newAvatarUrl
        dispatch(updateCurrentActiveBoard(newBoard))
      }

      if (activeCardRef.current) {
        const updatedComments = activeCardRef.current.comments?.map(comment =>
          comment.userId === data.userId ? { ...comment, userAvatar: data.newAvatarUrl } : comment
        )
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, comments: updatedComments }))
      }
    })

    socketIoInstance.on('BE_USER_DISPLAYNAME_UPDATED', (data) => {
      const newBoard = cloneDeep(board)
      const userToUpdate = newBoard.FE_allUsers?.find(user => user._id === data.userId)
      if (userToUpdate) {
        userToUpdate.displayName = data.newDisplayName
        dispatch(updateCurrentActiveBoard(newBoard))
      }

      if (activeCardRef.current) {
        const updatedComments = activeCardRef.current.comments?.map(comment =>
          comment.userId === data.userId ? { ...comment, userDisplayName: data.newDisplayName } : comment
        )
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, comments: updatedComments }))
      }
    })

    return () => {
      socketIoInstance.off('BE_COLUMN_CREATED')
      socketIoInstance.off('BE_COLUMN_MOVED')
      socketIoInstance.off('BE_COLUMN_DELETED')
      socketIoInstance.off('BE_CARD_CREATED')
      socketIoInstance.off('BE_CARD_MOVED_IN_COLUMN')
      socketIoInstance.off('BE_CARD_MOVED')
      socketIoInstance.off('BE_CARD_MADE_SUBCARD')
      socketIoInstance.off('BE_SUBCARD_DELETED')
      socketIoInstance.off('BE_COLUMN_UPDATED')
      socketIoInstance.off('BE_CARD_UPDATED')
      socketIoInstance.off('BE_CARD_DELETED')
      socketIoInstance.off('BE_BOARD_UPDATED')
      socketIoInstance.off('BE_BOARD_DELETED')
      socketIoInstance.off('BE_COMMENT_ADDED')
      socketIoInstance.off('BE_COMMENT_DELETED')
      socketIoInstance.off('BE_ATTACHMENT_ADDED')
      socketIoInstance.off('BE_ATTACHMENT_DELETED')
      socketIoInstance.off('BE_CARD_COVER_ADDED')
      socketIoInstance.off('BE_CARD_COVER_REMOVED')
      socketIoInstance.off('BE_CARD_MEMBERS_UPDATED')
      socketIoInstance.off('BE_USER_REMOVED_FROM_BOARD')
      socketIoInstance.off('BE_USER_ADDED_TO_BOARD')
      socketIoInstance.off('BE_CARD_DESCRIPTION_UPDATED')
      socketIoInstance.off('BE_USER_AVATAR_UPDATED')
      socketIoInstance.off('BE_USER_DISPLAYNAME_UPDATED')
    }
  }, [board, dispatch, navigate])

  // Func gọi API và xử lý kéo thả column
  const moveColumns = (dndOrderedColumns) => {
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    dispatch(updateCurrentActiveBoard(newBoard))

    updateBoardDetailsAPI(newBoard._id, { columnOrderIds: dndOrderedColumnsIds })
  }

  const moveCardInTheSameColumn = (dndOrderedCards, dndOrderedCardIds, columnId) => {
    const newBoard = cloneDeep(board)
    const columnToUpdate = newBoard.columns.find(column => column._id === columnId)
    if (columnToUpdate) {
      columnToUpdate.cards = dndOrderedCards
      columnToUpdate.cardOrderIds = dndOrderedCardIds
    }
    dispatch(updateCurrentActiveBoard(newBoard))

    socketIoInstance.emit('FE_CARD_MOVED_IN_COLUMN', {
      boardId: board._id,
      columnId,
      cardOrderIds: dndOrderedCardIds,
      actor: socketIoInstance.id
    })

    updateColumnDetailsAPI(columnId, { cardOrderIds: dndOrderedCardIds })
  }

  const moveCardToDifferentColumn = (currentCardId, prevColumnId, nextColumnId, dndOrderedColumns) => {
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    dispatch(updateCurrentActiveBoard(newBoard))

    let prevCardOrderIds = dndOrderedColumns.find(c => c._id === prevColumnId)?.cardOrderIds

    if (prevCardOrderIds[0].includes('placeholder-card') ) {
      prevCardOrderIds = []
    }

    socketIoInstance.emit('FE_CARD_MOVED', {
      boardId: board._id,
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds: dndOrderedColumns.find(c => c._id === nextColumnId)?.cardOrderIds,
      actor: socketIoInstance.id
    })

    moveCardToDifferentColumnAPI({
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds: dndOrderedColumns.find(c => c._id === nextColumnId)?.cardOrderIds
    })
  }

  if (!board) {
    return (
      <PageLoadingSpinner caption="Loading Board..." />
    )
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      <ActiveCard/>
      <AppBar/>
      <BoardBar board={board} />
      <BoardContent
        board={board}
        moveColumns={moveColumns}
        moveCardInTheSameColumn={moveCardInTheSameColumn}
        moveCardToDifferentColumn={moveCardToDifferentColumn}
      />
    </Container>
  )
}

export default Board