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
import { updateCardInBoard, deleteCardFromBoard } from '~/redux/activeBoard/activeBoardSlice'
import { updateCurrentActiveCard, clearAndHideCurrentActiveCard, selectCurrentActiveCard } from '~/redux/activeCard/activeCardSlice'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '~/redux/user/userSlice'

function Board() {
  const dispatch = useDispatch()
  // Không dùng state của component nữa mà chuyển sang dùng state của redux
  // const [board, setBoard] = useState(null)
  const board = useSelector(selectCurrentActiveBoard)
  const currentUser = useSelector(selectCurrentUser)
  const currentUserId = currentUser?._id
  const activeCard = useSelector(selectCurrentActiveCard)

  const navigate = useNavigate()

  const { boardId } = useParams()
  const activeCardRef = useRef(activeCard)

  useEffect(() => {
    activeCardRef.current = activeCard
  }, [activeCard])

  useEffect(() => {
    // Call API
    dispatch(fetchBoardDetailsAPI(boardId))
  }, [dispatch, boardId])

  useEffect(() => {
    if (board?._id) {
      socketIoInstance.emit('FE_JOIN_BOARD', board._id)
    }

    // Listener cho create column realtime
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
      // Update columns theo columnOrderIds mới từ BE
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

      // Update prevColumn
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

      // Update nextColumn
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
      if (data.boardId !== board._id) return
      const newBoard = cloneDeep(board)
      const column = newBoard.columns.find(col => col._id === data.columnId)
      if (column) {
        const card = column.cards.find(c => c._id === data.cardId)
        if (card) {
          card.title = data.newTitle
          const updatedCard = { ...card, title: data.newTitle, columnId: data.columnId }
          dispatch(updateCardInBoard(updatedCard))
          // Cập nhật currentActiveCard bất kể modal có mở hay không
          dispatch(updateCurrentActiveCard(updatedCard))
        }
      }
      dispatch(updateCurrentActiveBoard(newBoard))
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
      const column = newBoard.columns.find(col => col.cards.some(card => card._id === data.cardId))
      if (!column) return

      const card = column.cards.find(c => c._id === data.cardId)
      if (!card) return

      // unshift comment mới vào đầu mảng
      card.comments = [data.comment, ...(card.comments || [])]

      // Update redux
      dispatch(updateCurrentActiveBoard(newBoard))
      if (activeCardRef.current?._id === data.cardId) {
        dispatch(updateCurrentActiveCard({ ...card, comments: card.comments }))
      }
    })


    socketIoInstance.on('BE_COMMENT_DELETED', (data) => {
      if (!board?._id || data.boardId !== board._id) return

      const newBoard = cloneDeep(board)

      // Tìm column chứa card
      const column = newBoard.columns.find(col => col.cards.some(card => card._id === data.cardId))
      if (!column) return

      // Update comments của card
      const card = column.cards.find(c => c._id === data.cardId)
      if (!card) return

      // Tìm comment vừa bị xóa
      const deletedComment = card.comments.find(c => c._id === data.commentId)

      card.comments = (card.comments || []).filter(comment => comment._id !== data.commentId)

      // Update Board + ActiveCard
      dispatch(updateCurrentActiveBoard(newBoard))
      if (activeCardRef.current?._id === data.cardId) {
        dispatch(updateCurrentActiveCard({ ...card }))
      }

      // Chỉ toast nếu comment của currentUser bị người khác xóa
      if (deletedComment && deletedComment.userId === currentUser._id) {
        toast.warning('Your comment has been deleted by another user.')
      }
    })

    // Listener cho add attachment realtime
    socketIoInstance.on('BE_ATTACHMENT_ADDED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(column => column._id === data.columnId)
      if (columnToUpdate) {
        const cardToUpdate = columnToUpdate.cards.find(card => card._id === data.cardId)
        if (cardToUpdate) {
          cardToUpdate.attachments = data.attachments
        }
      }
      dispatch(updateCurrentActiveBoard(newBoard))
      if (activeCardRef.current?._id === data.cardId) {
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, attachments: data.attachments }))
      }
    })

    // Listener cho delete attachment realtime
    socketIoInstance.on('BE_ATTACHMENT_DELETED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(column => column._id === data.columnId)
      if (columnToUpdate) {
        const cardToUpdate = columnToUpdate.cards.find(card => card._id === data.cardId)
        if (cardToUpdate) {
          cardToUpdate.attachments = cardToUpdate.attachments.filter(att => att.url !== data.attachmentUrl)
        }
      }
      dispatch(updateCurrentActiveBoard(newBoard))

      if (activeCardRef.current?._id === data.cardId) {
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, attachments: activeCard.attachments.filter(att => att.url !== data.attachmentUrl) }))
      }
    })

    socketIoInstance.on('BE_CARD_COVER_ADDED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(column => column._id === data.columnId)
      if (columnToUpdate) {
        const cardToUpdate = columnToUpdate.cards.find(card => card._id === data.cardId)
        if (cardToUpdate) {
          cardToUpdate.cover = data.cover
        }
      }
      dispatch(updateCurrentActiveBoard(newBoard))

      if (activeCardRef.current?._id === data.cardId) {
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, cover: data.cover }))
      }
    })

    socketIoInstance.on('BE_CARD_COVER_REMOVED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(column => column._id === data.columnId)
      if (columnToUpdate) {
        const cardToUpdate = columnToUpdate.cards.find(card => card._id === data.cardId)
        if (cardToUpdate) {
          cardToUpdate.cover = null
        }
      }
      dispatch(updateCurrentActiveBoard(newBoard))

      if (activeCardRef.current?._id === data.cardId) {
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, cover: null }))
      }
    })

    socketIoInstance.on('BE_CARD_MEMBERS_UPDATED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(column => column._id === data.columnId)
      if (columnToUpdate) {
        const cardToUpdate = columnToUpdate.cards.find(card => card._id === data.cardId)
        if (cardToUpdate) {
          cardToUpdate.memberIds = data.memberIds
        }
      }

      // Cập nhật redux
      dispatch(updateCurrentActiveBoard(newBoard))

      if (activeCardRef.current?._id === data.cardId) {
        dispatch(updateCurrentActiveCard({
          ...activeCardRef.current,
          memberIds: data.memberIds
        }))
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
      // Khởi tạo FE_allUsers nếu chưa có
      newBoard.FE_allUsers = newBoard.FE_allUsers || []
      if (!newBoard.FE_allUsers.some(u => u._id === user._id)) {
        newBoard.FE_allUsers = [...newBoard.FE_allUsers, user]
        dispatch(updateCurrentActiveBoard(newBoard))
      }
    })

    socketIoInstance.on('BE_CARD_DESCRIPTION_UPDATED', (data) => {
      if (data.boardId !== board._id) return

      const newBoard = cloneDeep(board)
      const column = newBoard.columns.find(col => col._id === data.columnId)
      if (column) {
        const card = column.cards.find(c => c._id === data.cardId)
        // console.log('🚀 ~ Board ~ card:', card)
        if (card) {
          card.description = data.newDescription
          // Cập nhật card trong board
          dispatch(updateCardInBoard({ ...card, description: data.newDescription }))
          // Nếu modal card đang mở, cập nhật activeCard
          if (activeCardRef.current?._id === data.cardId) {
            dispatch(updateCurrentActiveCard({ ...activeCardRef.current, description: data.newDescription }))
          }
        }
      }
      // Cập nhật toàn bộ board
      dispatch(updateCurrentActiveBoard(newBoard))
    })

    socketIoInstance.on('BE_USER_AVATAR_UPDATED', (data) => {
      const newBoard = cloneDeep(board)
      const userToUpdate = newBoard.FE_allUsers?.find(user => user._id === data.userId)
      if (userToUpdate) {
        userToUpdate.avatar = data.newAvatarUrl
        dispatch(updateCurrentActiveBoard(newBoard))
      }

      // Cập nhật trong activeCard comments nếu đang mở
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

      // Cập nhật trong activeCard comments nếu đang mở
      if (activeCardRef.current) {
        const updatedComments = activeCardRef.current.comments?.map(comment =>
          comment.userId === data.userId ? { ...comment, userDisplayName: data.newDisplayName } : comment
        )
        dispatch(updateCurrentActiveCard({ ...activeCardRef.current, comments: updatedComments }))
      }
    })

    return () => {
      socketIoInstance.off('BE_COLUMN_MOVED')
      socketIoInstance.off('BE_COLUMN_CREATED')
      socketIoInstance.off('BE_COLUMN_DELETED')
      socketIoInstance.off('BE_CARD_CREATED')
      socketIoInstance.off('BE_COLUMN_MOVED')
      socketIoInstance.off('BE_CARD_MOVED_IN_COLUMN')
      socketIoInstance.off('BE_CARD_MOVED')
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
    // Update dữ liệu state board
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    // setBoard(newBoard)
    dispatch(updateCurrentActiveBoard(newBoard))

    // Gọi API update board
    updateBoardDetailsAPI(newBoard._id, { columnOrderIds: dndOrderedColumnsIds })
  }

  // Khi di chuyển card trong một column thì chỉ cần gọi API để cập nhập columnOrderIds của column
  const moveCardInTheSameColumn = (dndOrderedCards, dndOrderedCardIds, columnId) => {
    // Update dữ liệu state board
    // const newBoard = { ...board }
    const newBoard = cloneDeep(board)
    const columnToUpdate = newBoard.columns.find(column => column._id === columnId)
    if (columnToUpdate) {
      columnToUpdate.cards = dndOrderedCards
      columnToUpdate.cardOrderIds = dndOrderedCardIds
    }
    // setBoard(newBoard)
    dispatch(updateCurrentActiveBoard(newBoard))

    // Emit sự kiện Socket.IO
    socketIoInstance.emit('FE_CARD_MOVED_IN_COLUMN', {
      boardId: board._id,
      columnId,
      cardOrderIds: dndOrderedCardIds,
      actor: socketIoInstance.id
    })

    // Gọi API update column
    updateColumnDetailsAPI(columnId, { cardOrderIds: dndOrderedCardIds })
  }

  const moveCardToDifferentColumn = (currentCardId, prevColumnId, nextColumnId, dndOrderedColumns) => {
    // Update dữ liệu state board
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    // setBoard(newBoard)
    dispatch(updateCurrentActiveBoard(newBoard))

    // Gọi API xử lý phía BE
    let prevCardOrderIds = dndOrderedColumns.find(c => c._id === prevColumnId)?.cardOrderIds

    // Xử lý vấn đề khi kéo card cuối cùng ra khỏi column, cần xóa placeholder card trước khi gửi cho BE
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
      actor: socketIoInstance.id // Gửi socket.id của client
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
      {/* Modal Active Card, check đóng/mở dựa theo cái State isShowModalActiveCard lưu trong Redux */}
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