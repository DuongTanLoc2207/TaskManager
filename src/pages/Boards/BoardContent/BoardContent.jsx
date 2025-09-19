import { socketIoInstance } from '~/socketClient'
import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import {
  DndContext,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
  pointerWithin,
  getFirstCollision,
  closestCenter
} from '@dnd-kit/core'
import { MouseSensor, TouchSensor } from '~/customLibraries/DndKitSensors'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { makeSubCardInBoard, setOverCardId, setIsCtrlPressed, toggleSubCardMode } from '~/redux/activeBoard/activeBoardSlice'
import { updateCurrentActiveCard } from '~/redux/activeCard/activeCardSlice'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'
import { cloneDeep, isEmpty } from 'lodash'
import { generatePlaceholderCard } from '~/utils/formatters'
import { updateCardDetailsAPI } from '~/apis'
import { toast } from 'react-toastify'
import { useMediaQuery } from '@mui/material'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({
  board,
  moveColumns,
  moveCardInTheSameColumn,
  moveCardToDifferentColumn
}) {
  const dispatch = useDispatch()
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })
  const sensors = useSensors(mouseSensor, touchSensor)

  const [orderedColumns, setOrderedColumns] = useState([])

  const isCtrlPressed = useSelector(state => state.activeBoard.isCtrlPressed)
  const isSubCardMode = useSelector(state => state.activeBoard.isSubCardMode)
  const isMobileOrTablet = useMediaQuery(theme => theme.breakpoints.down('md'))

  const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)
  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null)

  // Điểm va chạm cuối cùng trước đó
  const lastOverId = useRef(null)

  // Listener cho Shift key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control') {
        dispatch(setIsCtrlPressed(true))
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'Control') {
        dispatch(setIsCtrlPressed(false))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [dispatch])

  useEffect(() => {
    if (!isMobileOrTablet && isSubCardMode) {
      dispatch(toggleSubCardMode(false))
    }
  }, [isMobileOrTablet, isSubCardMode, dispatch])


  useEffect(() => {
    setOrderedColumns(board.columns)
  }, [board])

  const findColumnsByCardId = (cardId) => {
    return orderedColumns.find(column => column?.cards?.map(card => card._id)?.includes(cardId))
  }

  // Func cập nhật lại state trong trường hợp di chuyển card giữa các column khác nhau
  const moveCardBetweenDifferentColumn = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData,
    triggerFrom
  ) => {
    setOrderedColumns(prevColumns => {
      const overCardIndex = overColumn?.cards?.findIndex(card => card._id === overCardId)

      // Tính toán vị trí index mới
      let newCardIndex
      const isBelowOverItem =
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height
      const modifier = isBelowOverItem ? 1 : 0
      newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length + 1

      const nextColumns = cloneDeep(prevColumns)
      const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
      const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)

      // Column cũ
      if (nextActiveColumn) {
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)
        if (isEmpty(nextActiveColumn.cards)) {
          nextActiveColumn.cards = [generatePlaceholderCard(nextActiveColumn)]
        }
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
      }

      // Column mới
      if (nextOverColumn) {
        nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        }

        // Thêm card đang kéo vào vị trí mới
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData)

        if (triggerFrom === 'handleDragOver') {
          // Chỉ tạo placeholder nếu column mới trống
          if ((!nextOverColumn.cards || nextOverColumn.cards.length === 0) &&
              !nextOverColumn.cards.some(card => card.FE_PlaceholderCard)) {
            nextOverColumn.cards.push(generatePlaceholderCard(nextOverColumn))
          }
        }

        if (triggerFrom === 'handleDragEnd') {
          nextOverColumn.cards = nextOverColumn.cards.filter(card => !card.FE_PlaceholderCard)
        }

        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
      }

      // Khi thả xong thì mới gọi API
      if (triggerFrom === 'handleDragEnd') {
        setTimeout(() => {
          moveCardToDifferentColumn(
            activeDraggingCardId,
            oldColumnWhenDraggingCard._id,
            nextOverColumn._id,
            nextColumns
          )
        }, 0)
      }

      return nextColumns
    })
  }

  const moveCardToCard = (childCardId, parentCardId) => {
    if (!parentCardId || String(parentCardId).includes('placeholder-card')) return
    dispatch(makeSubCardInBoard({ childCardId, parentCardId }))

    updateCardDetailsAPI(childCardId, {
      action: 'make-subcard',
      parentCardId
    })
      .then(updatedCard => {
        dispatch(updateCurrentActiveCard(updatedCard))

        socketIoInstance.emit('FE_CARD_MADE_SUBCARD', {
          boardId: board._id,
          childCardId,
          parentCardId,
          cardData: updatedCard
        })

        toast.success('Sub-card created successfully!')
      })
      .catch(() => {
        toast.error('Error creating sub-card, please try again.')
      })
  }


  // Trigger khi bắt đầu kéo một phần tử (drag)
  const handleDragStart = (event) => {
    setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(event?.active?.data?.current)

    // Nếu là kéo card thì mới thực hiện set giá trị oldColumn
    if (event?.active?.data?.current?.columnId) {
      setOldColumnWhenDraggingCard(findColumnsByCardId((event?.active?.id)))
    }
  }

  // Trigger trong quá trình kéo một phần tử (drag)
  const handleDragOver = (event) => {
    const { active, over } = event
    if (!active || !over) {
      dispatch(setOverCardId(null))
      return
    }
    const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
    const { id: overCardId } = over
    if (overCardId !== activeDraggingCardId) {
      dispatch(setOverCardId(overCardId))
    } else {
      dispatch(setOverCardId(null))
    }
    if (isCtrlPressed || isSubCardMode) {
      return
    }

    // Tìm 2 columns theo cardId
    const activeColumn = findColumnsByCardId(activeDraggingCardId)
    const overColumn = findColumnsByCardId(overCardId)

    if (!activeColumn || !overColumn) return

    // Xử lý khi kéo thả card qua column khác
    if (activeColumn._id != overColumn._id) {
      moveCardBetweenDifferentColumn(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData,
        'handleDragOver'
      )
    }
  }

  // Trigger khi kết thúc hành động kéo một phần tử (drop)
  const handleDragEnd = (event) => {
    dispatch(setOverCardId(null))
    dispatch(setIsCtrlPressed(false))
    const { active, over } = event
    if (!active || !over) return

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
      const { id: overCardId } = over

      // Tìm card đích (nếu có)
      const overCard = orderedColumns
        .flatMap(col => col.cards)
        .find(card => card._id === overCardId)

      // Tìm column chứa card đang kéo và card đích
      const activeColumn = findColumnsByCardId(activeDraggingCardId)
      const overColumn = findColumnsByCardId(overCardId)
      if (!activeColumn || !overColumn) return

      // CASE 1: Ctrl pressed → Tạo subcard
      if ((isCtrlPressed || isSubCardMode) && overCard && overCardId !== activeDraggingCardId) {
        // Không cho phép placeholder card làm parent
        if (overCard.FE_PlaceholderCard) return

        // Check overlap thật sự (tránh bug hover column mà chưa chạm card)
        const activeRect = active?.rect?.current?.translated ?? active?.rect?.current?.initial
        const overRect = over?.rect
        const isReallyOverCard = !!(
          activeRect && overRect &&
          activeRect.top < overRect.bottom &&
          activeRect.bottom > overRect.top &&
          activeRect.left < overRect.right &&
          activeRect.right > overRect.left
        )

        if (isReallyOverCard) {
          // Xóa card khỏi column ngay lập tức (tránh nhảy về cũ)
          setOrderedColumns(prev => {
            const next = cloneDeep(prev)
            const col = next.find(c => c._id === activeColumn._id)
            if (col) {
              col.cards = col.cards.filter(c => c._id !== activeDraggingCardId)
              col.cardOrderIds = col.cards.map(c => c._id)
            }
            return next
          })

          moveCardToCard(activeDraggingCardId, overCardId)
        }
        return
      }

      // CASE 2: Move card bình thường
      if (overCard && overCardId !== activeDraggingCardId) {
        const overCardIndex = overColumn.cards.findIndex(c => c._id === overCardId)

        if (oldColumnWhenDraggingCard._id !== overColumn._id) {
          // Giữa 2 columns khác nhau
          moveCardBetweenDifferentColumn(
            overColumn,
            overCardId,
            active,
            over,
            activeColumn,
            activeDraggingCardId,
            activeDraggingCardData,
            'handleDragEnd'
          )
        } else {
          // Trong cùng column
          const oldCardIndex = oldColumnWhenDraggingCard.cards.findIndex(c => c._id === activeDragItemId)
          const dndOrderedCards = arrayMove(oldColumnWhenDraggingCard.cards, oldCardIndex, overCardIndex)
          const dndOrderedCardIds = dndOrderedCards.map(card => card._id)

          setOrderedColumns(prev => {
            const next = cloneDeep(prev)
            const col = next.find(c => c._id === overColumn._id)
            col.cards = dndOrderedCards
            col.cardOrderIds = dndOrderedCardIds
            return next
          })

          setTimeout(() => {
            moveCardInTheSameColumn(dndOrderedCards, dndOrderedCardIds, oldColumnWhenDraggingCard._id)
          }, 0)
        }
        return
      }

      // CASE 3: Kéo vào column
      if (!isCtrlPressed) {
        if (oldColumnWhenDraggingCard._id !== overColumn._id) {
          moveCardBetweenDifferentColumn(
            overColumn,
            overCardId,
            active,
            over,
            activeColumn,
            activeDraggingCardId,
            activeDraggingCardData,
            'handleDragEnd'
          )
        } else {
          const oldCardIndex = oldColumnWhenDraggingCard.cards.findIndex(c => c._id === activeDragItemId)
          const newCardIndex = overColumn.cards.findIndex(c => c._id === overCardId)
          const dndOrderedCards = arrayMove(oldColumnWhenDraggingCard.cards, oldCardIndex, newCardIndex)
          const dndOrderedCardIds = dndOrderedCards.map(card => card._id)

          setOrderedColumns(prev => {
            const next = cloneDeep(prev)
            const col = next.find(c => c._id === overColumn._id)
            col.cards = dndOrderedCards
            col.cardOrderIds = dndOrderedCardIds
            return next
          })

          moveCardInTheSameColumn(dndOrderedCards, dndOrderedCardIds, oldColumnWhenDraggingCard._id)
        }
      }
    }

    // CASE 4: Column Drag
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active.id !== over.id) {
        const oldColumnIndex = orderedColumns.findIndex(c => c._id === active.id)
        const newColumnIndex = orderedColumns.findIndex(c => c._id === over.id)
        const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex)
        const newColumnOrderIds = dndOrderedColumns.map(c => c._id)

        socketIoInstance.emit('FE_COLUMN_MOVED', {
          boardId: board._id,
          columnOrderIds: newColumnOrderIds
        })

        setOrderedColumns(dndOrderedColumns)
        moveColumns(dndOrderedColumns)
      }
    }

    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColumnWhenDraggingCard(null)
  }


  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } })
  }

  const collisionDetectionStrategy = useCallback((args) => {
    // Trường hợp kéo column thì dùng thuật toán closestCorners
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return closestCorners({ ...args })
    }

    // Tìm các điểm giao nhau, va chạm - intersections với con trỏ
    const pointerIntersections = pointerWithin(args)

    // Fix bug flickering khi kéo card có cover lớn và kéo lên trên cùng ra khỏi khu vực kéo thả
    if (!pointerIntersections?.length) return

    // Tìm overId đầu tiên trong intersections ở trên
    let overId = getFirstCollision(pointerIntersections, 'id')
    if (overId) {
      // Nếu overId là column thì sẽ tìm cardId gần nhất bên trong khu vực va chạm dựa vào thuật toán phát hiện va chạm closestCenter hoặc closestCorners
      const checkColumn = orderedColumns.find(column => column._id === overId)
      if (checkColumn) {
        overId = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(container => {
            return (container.id !== overId) && checkColumn?.cardOrderIds?.includes(container.id)
          })
        })[0]?.id
      }

      lastOverId.current = overId
      return [{ id: overId }]
    }

    // Nếu overId là null thì trả về mảng rỗng - tránh bug crash trang
    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }, [activeDragItemType, orderedColumns])

  return (
    <DndContext
      sensors={sensors}
      // Custom thuật toán phát hiện va chạm
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        width: '100%',
        height: (theme) => theme.taskManager.boardContentHeight,
        p: '10px 0'
      }}>
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={customDropAnimation}>
          {!activeDragItemType && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData} />}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData} />}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent