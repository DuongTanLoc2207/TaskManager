import { useState } from 'react'
import { toast } from 'react-toastify'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Tooltip from '@mui/material/Tooltip'
import DeleteIcon from '@mui/icons-material/Delete'
import PostAddIcon from '@mui/icons-material/PostAdd'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CloseIcon from '@mui/icons-material/Close'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import ListCards from './ListCards/ListCards'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useConfirm } from 'material-ui-confirm'
import { createNewCardAPI, deleteColumnDetailsAPI, updateColumnDetailsAPI } from '~/apis'
import { cloneDeep } from 'lodash'
import { updateCurrentActiveBoard, selectCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { useDispatch, useSelector } from 'react-redux'
import ToggleFocusInput from '~/components/Form/ToggleFocusInput'
import { socketIoInstance } from '~/socketClient'

function Column({ column }) {
  const dispatch = useDispatch()
  const board = useSelector(selectCurrentActiveBoard)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column._id,
    data: { ...column }
  })
  const dndKitColumnStyles = {
    touchAction: 'none',
    // CSS.Transform bị lỗi stretch
    transform: CSS.Translate.toString(transform),
    transition,
    // fix lỗi column ngắn kéo qua column dài bằng cách max height và đưa {...listeners} vào Box chứ không pjải ở div
    height: '100%',
    opacity: isDragging ? 0.5 : undefined
  }

  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  // Card đã đc sắp xếp ở component cha
  const orderedCards = column.cards

  const [openNewCardForm, setOpenNewCardForm] = useState(false)
  const toggleNewCardForm = () => setOpenNewCardForm(!openNewCardForm)

  const [newCardTitle, setNewCardTitle] = useState('')
  const addNewCard = async () => {
    const trimmedTitle = newCardTitle.trim()

    if (!trimmedTitle) {
      toast.error('Please enter your card title', { position: 'bottom-right' })
      return
    }

    // Tạo dữ liệu Card để gọi API
    const newCardData = {
      title: trimmedTitle,
      columnId: column._id
    }

    // Gọi API tạo mới card và làm mới dữ liệu state board
    const createdCard = await createNewCardAPI({
      ...newCardData,
      boardId: board._id
    })

    // Cập nhật state board
    // const newBoard = { ...board }
    const newBoard = cloneDeep(board)
    const columnToUpdate = newBoard.columns.find(column => column._id === createdCard.columnId)
    if (columnToUpdate) {
      if (columnToUpdate.cards.some(card => card.FE_PlaceholderCard)) {
        // Trường hợp column rỗng tức là đang chứa placeholder card
        columnToUpdate.cards = [createdCard]
        columnToUpdate.cardOrderIds = [createdCard._id]
      } else {
        // Column đã có dữ liệu
        columnToUpdate.cards.push(createdCard)
        columnToUpdate.cardOrderIds.push(createdCard._id)
      }
    }
    // setBoard(newBoard)
    dispatch(updateCurrentActiveBoard(newBoard))

    socketIoInstance.emit('FE_CARD_CREATED', {
      boardId: board._id,
      createdCard
    })

    // Đóng trạng thái thêm Card mới và clear input
    toggleNewCardForm()
    setNewCardTitle('')
  }

  // Xử lý xóa một column và cards bên trong nó
  const confirmDeleteColumn = useConfirm()
  const handleDeleteColumn = () => {
    confirmDeleteColumn({
      title: 'Delete Column?',
      description: 'This action will permanently delete your Column and its Cards! Are you sure?',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel'
      // buttonOrder: ['confirm', 'cancel']
      // allowClose: false,
      // dialogProps: { maxWidth: 'xs' },
      // cancellationButtonProps: { color: 'inherit' },
      // confirmationButtonProps: { color: 'secondary', variant: 'outlined' },

    })
      .then(() => {
        // Update dữ dữ liệu state board
        const newBoard = { ...board }
        newBoard.columns = newBoard.columns.filter(c => c._id !== column._id)
        newBoard.columnOrderIds = newBoard.columnOrderIds.filter(_id => _id !== column._id)
        // setBoard(newBoard)
        dispatch(updateCurrentActiveBoard(newBoard))

        // Gọi API xử lý phía BE
        deleteColumnDetailsAPI(column._id).then(res => {
          toast.success(res?.deleteResult)
        })

        // Emit sự kiện xóa column
        socketIoInstance.emit('FE_COLUMN_DELETED', {
          boardId: board._id,
          columnId: column._id,
          actor: socketIoInstance.id
        })
      }).catch(() => {})
  }

  const onUpdateColumnTitle = (newTitle) => {
    // Gọi API update column và xử lý dữ liệu board trong reudux
    updateColumnDetailsAPI(column._id, { title: newTitle }).then(() => {
      const newBoard = cloneDeep(board)
      const columnToUpdate = newBoard.columns.find(c => c._id === column._id)
      if (columnToUpdate) columnToUpdate.title = newTitle

      dispatch(updateCurrentActiveBoard(newBoard))

      socketIoInstance.emit('FE_COLUMN_UPDATED', {
        boardId: board._id,
        columnId: column._id,
        newTitle
      })
    })
  }

  return (
    // fix flickering khi kéo thả column do chiều cao bằng cách bọc bằng div
    <div ref={setNodeRef} style={dndKitColumnStyles} {...attributes}>
      <Box
        {...listeners}
        sx={{
          minWidth: { xs: '260px', sm: '280px', md: '300px' },
          maxWidth: { xs: '260px', sm: '280px', md: '300px' },
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#333643' : '#ebecf0'),
          ml: 2,
          borderRadius: '6px',
          height: 'fit-content',
          maxHeight: (theme) => `calc(${theme.taskManager.boardContentHeight} - ${theme.spacing(5)})`
        }}
      >
        {/* Box column head */}
        <Box sx={{
          height: (theme) => theme.taskManager.columnHeaderHeight,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <ToggleFocusInput
            id={`toggle-focus-input-${column._id}`}
            value={column?.title}
            onChangedValue={onUpdateColumnTitle}
            data-no-dnd="true"
          />
          <Box>
            <Tooltip title="More options">
              <ExpandMoreIcon
                sx={{ color: 'text.primary', cursor: 'pointer' }}
                id="basic-column-dropdown"
                aria-controls={open ? 'basic-menu-column-dropdown' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
              />
            </Tooltip>
            <Menu
              id="basic-menu-column-dropdown"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-column-dropdown'
              }}
            >
              <MenuItem
                onClick={toggleNewCardForm}
                sx={{
                  '&:hover': {
                    color: 'success.light',
                    '& .post-add-icon': { color: 'success.light' }
                  }
                }}
              >
                <ListItemIcon><PostAddIcon className='post-add-icon' fontSize="small" /></ListItemIcon>
                <ListItemText>Add new card</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={handleDeleteColumn}
                sx={{
                  '&:hover': {
                    color: 'warning.dark',
                    '& .delete-icon': { color: 'warning.dark' }
                  }
                }}
              >
                <ListItemIcon><DeleteIcon className='delete-icon' fontSize="small" /></ListItemIcon>
                <ListItemText>Delete this column</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* List cards */}
        <ListCards cards={orderedCards} />

        {/* Box column footer */}
        <Box sx={{
          height: (theme) => theme.taskManager.columnFooterHeight,
          p: 2
        }}>
          {!openNewCardForm
            ? <Box sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Button startIcon={<PostAddIcon/> } onClick={toggleNewCardForm}>Add new card</Button>
              <Tooltip title="Drag to move">
                <DragHandleIcon sx={{ cursor: 'pointer' }}/>
              </Tooltip>
            </Box>
            : <Box sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <TextField
                label="Enter card title..."
                type="text"
                size="small"
                variant="outlined"
                autoFocus
                data-no-dnd="true"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                sx={{
                  '& label': { color: 'text.primary' },
                  '& input': {
                    color: (theme) => theme.palette.primary.main,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#333643': 'white')
                  },
                  '& label.Mui-focused': { color: (theme) => theme.palette.primary.main },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: (theme) => theme.palette.primary.main },
                    '&:hover fieldset': { borderColor: (theme) => theme.palette.primary.main },
                    '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main }
                  },
                  '& .MuiOutlinedInput-input': {
                    borderRadius: 1
                  }
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  className='interceptor-loading'
                  data-no-dnd="true"
                  onClick={addNewCard}
                  variant='contained' color='success' size='small'
                  sx={{
                    boxShadow: 'none',
                    border: '0.5px solid',
                    borderColor: (theme) => theme.palette.success.main,
                    '&:hover': { bgcolor: (theme) => theme.palette.success.main }
                  }}
                >Add</Button>
                <CloseIcon
                  fontSize='small'
                  sx={{
                    color: (theme) => theme.palette.warning.light,
                    cursor: 'pointer'
                  }}
                  onClick={toggleNewCardForm}
                />
              </Box>
            </Box>
          }
        </Box>
      </Box>
    </div>
  )
}

export default Column