import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CancelIcon from '@mui/icons-material/Cancel'
import Grid from '@mui/material/Unstable_Grid2'
import Stack from '@mui/material/Stack'
// import Divider from '@mui/material/Divider'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
// import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
// import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
// import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined'
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
// import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined'
// import AspectRatioOutlinedIcon from '@mui/icons-material/AspectRatioOutlined'
// import AddToDriveOutlinedIcon from '@mui/icons-material/AddToDriveOutlined'
// import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
// import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
// import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
// import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
// import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import SubjectRoundedIcon from '@mui/icons-material/SubjectRounded'
import DvrOutlinedIcon from '@mui/icons-material/DvrOutlined'

import ToggleFocusInput from '~/components/Form/ToggleFocusInput'
import VisuallyHiddenInput from '~/components/Form/VisuallyHiddenInput'
import { singleFileValidator, attachmentFileValidator } from '~/utils/validators'
import { toast } from 'react-toastify'
import CardUserGroup from './CardUserGroup'
import CardDescriptionMdEditor from './CardDescriptionMdEditor'
import CardActivitySection from './CardActivitySection'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearAndHideCurrentActiveCard,
  selectCurrentActiveCard,
  updateCurrentActiveCard,
  selectIsShowModalActiveCard
} from '~/redux/activeCard/activeCardSlice'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { styled } from '@mui/material/styles'
import { updateCardDetailsAPI } from '~/apis'
import { updateCardInBoard } from '~/redux/activeBoard/activeBoardSlice'
import { CARD_MEMBER_ACTIONS } from '~/utils/constants'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { useConfirm } from 'material-ui-confirm'
import { deleteCardDetailsAPI } from '~/apis'
import { deleteCardFromBoard, selectCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { socketIoInstance } from '~/socketClient'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import IconButton from '@mui/material/IconButton'
import { useState } from 'react'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

const SidebarItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  fontSize: { xs: '12px', sm: '14px' },
  fontWeight: '600',
  color: theme.palette.mode === 'dark' ? '#90caf9' : '#172b4d',
  backgroundColor: theme.palette.mode === 'dark' ? '#2f3542' : '#091e420f',
  padding: '10px',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#33485D' : theme.palette.grey[300],
    '&.active': {
      color: theme.palette.mode === 'dark' ? '#000000de' : '#0c66e4',
      backgroundColor: theme.palette.mode === 'dark' ? '#90caf9' : '#e9f2ff'
    }
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px',
    padding: '8px'
  }
}))

const AttachmentLink = styled('a')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#90caf9' : '#172b4d', // Match với SidebarItem
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.mode === 'dark' ? '#e9f2ff' : '#0c66e4'
  },
  '&:visited': {
    color: theme.palette.mode === 'dark' ? '#90caf9' : '#172b4d' // Đảm bảo không tím
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px'
  }
}))

/**
 * Note: Modal là một low-component mà MUI sử dụng bên trong những thứ như Dialog, Drawer, Menu, Popover.
 */
function ActiveCard() {
  const dispatch = useDispatch()
  const activeCard = useSelector(selectCurrentActiveCard)
  const isShowModalActiveCard = useSelector(selectIsShowModalActiveCard)
  const currentUser = useSelector(selectCurrentUser)
  const confirm = useConfirm()

  const card = useSelector(selectCurrentActiveCard)
  const board = useSelector(selectCurrentActiveBoard)

  const [loading, setLoading] = useState(false)

  // Dùng phần isShowModalActiveCard để check đóng mở
  // const [isOpen, setIsOpen] = useState(true)
  // const handleOpenModal = () => setIsOpen(true)

  const handleCloseModal = () => {
    // setIsOpen(false)
    dispatch(clearAndHideCurrentActiveCard())
  }

  // Func gọi API dùng chung cho các trường hợp update card title, description, cover, comment...vv
  const callApiUpdateCard = async (updateData) => {
    const updatedCard = await updateCardDetailsAPI(activeCard._id, updateData)

    // B1: Cập nhật lại cái card đang active trong modal hiện tại
    dispatch(updateCurrentActiveCard(updatedCard))

    // B2: Cập nhật lại cái bản ghi card trong cái activeBoard (nested data)
    dispatch(updateCardInBoard(updatedCard))

    return updatedCard
  }

  const onUpdateCardTitle = (newTitle) => {
    callApiUpdateCard({ title: newTitle }).then(() => {
      socketIoInstance.emit('FE_CARD_UPDATED', {
        boardId: card.boardId,
        cardId: card._id,
        columnId: card.columnId,
        newTitle
      })
    }).catch(() => {
      toast.error('Failed to update card title', { position: 'bottom-right' })
    })
  }


  const onUpdateCardDescription = (newDescription) => {
    // Gọi API
    callApiUpdateCard({ description: newDescription }).then((updatedCard) => {
      // Emit socket event để realtime
      socketIoInstance.emit('FE_CARD_DESCRIPTION_UPDATED', {
        boardId: activeCard.boardId,
        cardId: activeCard._id,
        columnId: activeCard.columnId,
        newDescription: updatedCard.description // Gửi description mới từ API response để đảm bảo nhất quán
      })
    }).catch(() => {
      toast.error('Failed to update card description', { position: 'bottom-right' })
    })
  }

  const onUploadCardCover = (event) => {
    const error = singleFileValidator(event.target?.files[0])
    if (error) {
      toast.error(error)
      return
    }
    let reqData = new FormData()
    reqData.append('cardCover', event.target?.files[0])

    setLoading(true)
    // Gọi API
    toast.promise(
      callApiUpdateCard(reqData)
        .then(updatedCard => {
          socketIoInstance.emit('FE_CARD_COVER_ADDED', {
            boardId: activeCard.boardId,
            cardId: activeCard._id,
            columnId: activeCard.columnId,
            cover: updatedCard.cover,
            actor: socketIoInstance.id
          })
          return updatedCard
        })
        .finally(() => {
          event.target.value = '',
          setLoading(false)
        }),
      { pending: 'Updating...' }
    )
  }

  const onRemoveCardCover = () => {
    confirm({
      title: 'Remove Cover?',
      description: 'This will remove the card cover. Are you sure?',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel'
    })
      .then(async () => {
        setLoading(true)
        try {
          await toast.promise(
            callApiUpdateCard({ removeCover: true }),
            {
              pending: 'Removing cover...',
              success: 'Cover removed!',
              error: 'Failed to remove cover'
            }
          )
          socketIoInstance.emit('FE_CARD_COVER_REMOVED', {
            boardId: activeCard.boardId,
            cardId: activeCard._id,
            columnId: activeCard.columnId,
            actor: socketIoInstance.id
          })
        } catch (error) {
          toast.error('Remove failed: ' + error.message)
        } finally {
          setLoading(false)
        }
      })
      .catch(() => {})
  }

  // Dùng async await ở đây để component con CardActivitySection chờ và nếu thành công thì mới clear thẻ input comment
  const onAddCardComment = async (commentToAdd) => {
    const updatedCard = await callApiUpdateCard({ commentToAdd })
    const createdComment = updatedCard?.comments?.[0]
    return createdComment
  }

  const onUpdateCardMembers = (incomingMemberInfo) => {
    callApiUpdateCard({ incomingMemberInfo })
      .then((updatedCard) => {
        socketIoInstance.emit('FE_CARD_MEMBERS_UPDATED', {
          boardId: activeCard.boardId,
          columnId: activeCard.columnId,
          cardId: activeCard._id,
          memberIds: updatedCard.memberIds,
          actor: socketIoInstance.id
        })
      })
      .catch(() => {
        toast.error('Failed to update card members', { position: 'bottom-right' })
      })
  }

  const handleDeleteCard = () => {
    confirm({
      title: 'Delete Card?',
      description: 'This action will permanently delete your Card! Are you sure?',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel'
    })
      .then(() => {
        // Gọi API xóa card
        deleteCardDetailsAPI(activeCard._id).then(res => {
          toast.success(res?.deleteResult)

          // Cập nhật state board (xóa card khỏi column)
          dispatch(deleteCardFromBoard({
            cardId: activeCard._id,
            columnId: activeCard.columnId
          }))

          // Đóng modal
          dispatch(clearAndHideCurrentActiveCard())

          socketIoInstance.emit('FE_CARD_DELETED', {
            boardId: activeCard.boardId,
            columnId: activeCard.columnId,
            cardId: activeCard._id,
            actor: socketIoInstance.id
          })
        })
      }).catch(() => {})
  }

  // Upload nhiều file 1 lần
  const onUploadCardAttachment = async (event) => {
    const files = Array.from(event.target?.files || [])
    if (!files.length) return

    for (const f of files) {
      const err = attachmentFileValidator(f)
      if (err) {
        toast.error(err)
        event.target.value = ''
        return
      }
    }

    const formData = new FormData()
    files.forEach(file => formData.append('attachments', file))

    setLoading(true)
    try {
      const updatedCard = await toast.promise(
        updateCardDetailsAPI(activeCard._id, formData),
        {
          pending: `Uploading ${files.length} file(s)...`,
          success: `${files.length} file(s) uploaded`,
          error: err => `Upload failed: ${err.response?.data?.message || err.message}`
        }
      )
      dispatch(updateCurrentActiveCard(updatedCard))
      dispatch(updateCardInBoard(updatedCard))

      socketIoInstance.emit('FE_ATTACHMENT_ADDED', {
        boardId: activeCard.boardId,
        cardId: activeCard._id,
        attachments: updatedCard.attachments,
        actor: socketIoInstance.id
      })
    } catch (err) {
      // console.error('Attachment upload error:', err)
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  // Xóa attachment
  const onDeleteAttachment = async (attachmentUrl) => {
    if (!attachmentUrl) return
    setLoading(true)
    confirm({ title: 'Delete attachment?', description: 'This cannot be undone.' })
      .then(async () => {
        try {
          const updateData = { attachmentToRemove: attachmentUrl }
          const updatedCard = await updateCardDetailsAPI(activeCard._id, updateData)
          dispatch(updateCurrentActiveCard(updatedCard))
          dispatch(updateCardInBoard(updatedCard))
          toast.success('Attachment deleted!')

          socketIoInstance.emit('FE_ATTACHMENT_DELETED', {
            boardId: activeCard.boardId,
            cardId: activeCard._id,
            attachmentUrl,
            actor: socketIoInstance.id
          })
        } catch (error) {
          toast.error('Delete failed: ' + error.message)
        } finally {
          setLoading(false)
        }
      })
      .catch(() => {})
  }

  return (
    <Modal
      disableScrollLock
      open={isShowModalActiveCard}
      // onClose={handleCloseModal} // Sử dụng onClose trong trường hợp muốn đóng Modal bằng nút ESC hoặc click ra ngoài Modal
      sx={{ overflowY: 'auto' }}>
      <Box sx={{
        position: 'relative',
        width: '90%',
        maxWidth: 900,
        bgcolor: 'white',
        boxShadow: 24,
        borderRadius: '8px',
        border: 'none',
        outline: 0,
        padding: { xs: '20px 10px', sm: '40px 20px 20px' },
        margin: '50px auto',
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1A2027' : '#fff'
      }}>
        <Box sx={{
          position: 'absolute',
          top: '12px',
          right: '10px',
          cursor: 'pointer'
        }}>
          <CancelIcon color="error" sx={{ '&:hover': { color: 'error.light' } }} onClick={handleCloseModal} />
        </Box>

        {activeCard?.cover &&
          <Box sx={{ mb: 4 }}>
            <img
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                maxHeight: '60vh',
                borderRadius: '6px',
                objectFit: 'cover'
              }}
              src={activeCard?.cover}
              alt="card-cover"
            />
          </Box>
        }

        <Box sx={{ mb: { xs: 1, sm: 1 }, mt: { xs: 0.5, sm: -3 }, pr: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon />

          {/* Feature 01: Xử lý tiêu đề của Card */}
          <ToggleFocusInput
            id={`toggle-focus-input-${activeCard?._id}`}
            inputFontSize={{ xs: '20px', sm: '22px' }}
            value={activeCard?.title}
            onChangedValue={onUpdateCardTitle} />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Left side */}
          <Grid xs={12} sm={9}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: '600', color: 'primary.main', mb: 1 }}>Members</Typography>

              {/* Feature 02: Xử lý các thành viên của Card */}
              <CardUserGroup
                cardMemberIds={activeCard?.memberIds}
                onUpdateCardMembers={onUpdateCardMembers}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SubjectRoundedIcon />
                <Typography variant="span" sx={{ fontWeight: '600', fontSize: { xs: '16px', sm: '20px' } }}>Description</Typography>
              </Box>

              {/* Feature 03: Xử lý mô tả của Card */}
              <CardDescriptionMdEditor
                cardDescriptionProp={activeCard?.description}
                handleUpdateCardDescription={onUpdateCardDescription}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DvrOutlinedIcon />
                <Typography variant="span" sx={{ fontWeight: '600', fontSize: { xs: '16px', sm: '20px' } }}>Activity</Typography>
              </Box>

              {/* Feature 04: Xử lý các hành động, ví dụ comment vào Card */}
              <CardActivitySection
                cardComments={activeCard?.comments}
                onAddCardComment={onAddCardComment}
                cardId={activeCard?._id}
                boardId={board?._id} // Truyền boardId
              />
            </Box>
          </Grid>

          {/* Right side */}
          <Grid xs={12} sm={3}>
            <Typography sx={{ fontWeight: '600', color: 'primary.main', mb: 1 }}>Add To Card</Typography>
            <Stack direction="column" spacing={1}>
              {/* Feature 05: Xử lý hành động bản thân user tự join vào card */}
              {/* Nếu user hiện tại đang đăng nhập chưa thuộc mảng memberIds của card thì mới cho hiện nút Join và ngược lại */}
              {activeCard?.memberIds?.includes(currentUser._id)
                ? <SidebarItem
                  sx={{ color: 'error.light', '&:hover': { color: 'error.light' } }}
                  onClick={() => onUpdateCardMembers({
                    userId: currentUser._id,
                    action: CARD_MEMBER_ACTIONS.REMOVE
                  })}
                >
                  <ExitToAppIcon fontSize="small" />
                  Leave
                </SidebarItem>
                : <SidebarItem
                  className="active"
                  onClick={() => onUpdateCardMembers({
                    userId: currentUser._id,
                    action: CARD_MEMBER_ACTIONS.ADD
                  })}
                >
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PersonOutlineOutlinedIcon fontSize="small" />
                      <span>Join</span>
                    </Box>
                  </Box>
                </SidebarItem>
              }
              {/* Feature 06: Xử lý hành động cập nhật ảnh Cover của Card */}
              <SidebarItem
                className="active"
                component="label"
                sx={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}
              >
                <ImageOutlinedIcon fontSize="small" />
                Cover
                <VisuallyHiddenInput type="file" onChange={onUploadCardCover} />
              </SidebarItem>
              {activeCard?.cover && (
                <SidebarItem
                  sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}
                  onClick={onRemoveCardCover}
                  disabled={loading}
                >
                  <DeleteOutlineIcon fontSize="small" />
                    Remove Cover
                </SidebarItem>
              )}

              <SidebarItem
                className="active"
                component="label"
                sx={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}
              >
                <AttachFileOutlinedIcon fontSize="small" />
                  Attachment
                <VisuallyHiddenInput type="file" multiple onChange={onUploadCardAttachment} />
              </SidebarItem>

              {/* Danh sách attachments */}
              <List dense>
                {activeCard?.attachments?.map((att, index) => (
                  <ListItem key={`${att.url}-${index}`} divider>
                    <ListItemText
                      primary={
                        <AttachmentLink
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          download={att.filename}
                          title={att.filename}
                          style={{
                            wordBreak: 'break-word',
                            whiteSpace: 'normal'
                          }}
                        >
                          {att.filename}
                        </AttachmentLink>
                      }
                      secondary={`${att.size ? (att.size / 1024).toFixed(1) : '0.0'} KB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => onDeleteAttachment(att.url)}
                        disabled={loading}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {/* <SidebarItem><LocalOfferOutlinedIcon fontSize="small" />Labels</SidebarItem>
              <SidebarItem><TaskAltOutlinedIcon fontSize="small" />Checklist</SidebarItem>
              <SidebarItem><WatchLaterOutlinedIcon fontSize="small" />Dates</SidebarItem>
              <SidebarItem><AutoFixHighOutlinedIcon fontSize="small" />Custom Fields</SidebarItem> */}
            </Stack>

            {/* <Divider sx={{ my: 2 }} /> */}

            {/* <Typography sx={{ fontWeight: '600', color: 'primary.main', mb: 1 }}>Power-Ups</Typography>
            <Stack direction="column" spacing={1}>
              <SidebarItem><AspectRatioOutlinedIcon fontSize="small" />Card Size</SidebarItem>
              <SidebarItem><AddToDriveOutlinedIcon fontSize="small" />Google Drive</SidebarItem>
              <SidebarItem><AddOutlinedIcon fontSize="small" />Add Power-Ups</SidebarItem>
            </Stack> */}

            {/* <Divider sx={{ my: 2 }} /> */}

            <Typography sx={{ fontWeight: '600', color: 'primary.main', mb: 1 }}>Actions</Typography>
            <Stack direction="column" spacing={1}>
              <SidebarItem
                onClick={handleDeleteCard}
                sx={{
                  color: 'error.light',
                  '&:hover': {
                    color: 'error.main',
                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#d32f2f33' : '#ffebee'
                  }
                }}
              >
                <DeleteOutlineOutlinedIcon fontSize="small" />
                Delete
              </SidebarItem>
              {/* <SidebarItem><ContentCopyOutlinedIcon fontSize="small" />Copy</SidebarItem>
              <SidebarItem><AutoAwesomeOutlinedIcon fontSize="small" />Make Template</SidebarItem>
              <SidebarItem><ArchiveOutlinedIcon fontSize="small" />Archive</SidebarItem>
              <SidebarItem><ShareOutlinedIcon fontSize="small" />Share</SidebarItem> */}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  )
}

export default ActiveCard
