import { useState } from 'react'
import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CancelIcon from '@mui/icons-material/Cancel'
import Grid from '@mui/material/Unstable_Grid2'
import Stack from '@mui/material/Stack'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SubjectRoundedIcon from '@mui/icons-material/SubjectRounded'
import DvrOutlinedIcon from '@mui/icons-material/DvrOutlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
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
  selectIsShowModalActiveCard,
  showModalActiveCard
} from '~/redux/activeCard/activeCardSlice'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { styled } from '@mui/material/styles'
import { updateCardDetailsAPI, deleteCardDetailsAPI } from '~/apis'
import { updateCardInBoard, deleteCardFromBoard, selectCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { CARD_MEMBER_ACTIONS } from '~/utils/constants'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { useConfirm } from 'material-ui-confirm'
import { socketIoInstance } from '~/socketClient'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import IconButton from '@mui/material/IconButton'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { cloneDeep } from 'lodash'

const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  '& .MuiTreeItem-content': {
    padding: '8px 12px',
    borderRadius: '6px',
    margin: '2px 0',
    backgroundColor: theme.palette.mode === 'dark' ? '#2a2f3a' : '#f8fafc',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#3a3f4a' : '#e2e8f0',
      boxShadow: theme.shadows[2],
      transform: 'translateY(-1px)'
    }
  },
  '& .MuiTreeItem-label': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px'
  },
  '& .title': {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer'
  },
  '& .delete-button': {
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out'
  },
  '& .MuiTreeItem-content:hover .delete-button': {
    opacity: 1
  },
  '& .MuiTreeItem-root': {
    marginLeft: '16px'
  }
}))

const SubCardTreeItem = ({ subCard, handleOpenSubCard, handleDeleteSubCard }) => {
  if (!subCard || !subCard._id) {
    toast.error(`Invalid sub-card: ${JSON.stringify(subCard)}`, { position: 'bottom-right' })
    return null
  }

  return (
    <StyledTreeItem
      itemId={subCard._id}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LabelOutlinedIcon fontSize="small" color="action" />
            <Typography
              className="title"
              onClick={() => handleOpenSubCard(subCard._id)}
              title={subCard.title || 'No title'}
            >
              {subCard.title || '[No Title]'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            className="delete-button"
            color="error"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteSubCard(subCard)
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      {Array.isArray(subCard.subCards) &&
        subCard.subCards.map((childCard, index) => (
          <SubCardTreeItem
            key={childCard._id || `index-${index}`}
            subCard={childCard}
            handleOpenSubCard={handleOpenSubCard}
            handleDeleteSubCard={handleDeleteSubCard}
          />
        ))}
    </StyledTreeItem>
  )
}

const SubCardTree = ({ subCards, handleOpenSubCard, handleDeleteSubCard }) => {
  if (!Array.isArray(subCards) || subCards.length === 0) {
    return null
  }

  return (
    <SimpleTreeView
      slots={{
        expandIcon: ChevronRightIcon,
        collapseIcon: ExpandMoreIcon
      }}
      sx={{
        padding: '4px 0',
        '& .MuiTreeItem-root': {
          fontSize: { xs: '12px', sm: '14px' }
        }
      }}
    >
      {subCards.map((subCard, index) => (
        <SubCardTreeItem
          key={subCard._id || `index-${index}`}
          subCard={subCard}
          handleOpenSubCard={handleOpenSubCard}
          handleDeleteSubCard={handleDeleteSubCard}
        />
      ))}
    </SimpleTreeView>
  )
}

const SidebarItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  fontSize: '14px',
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
  [theme.breakpoints.down('md')]: {
    fontSize: '12px',
    padding: '8px'
  }
}))

const AttachmentLink = styled('a')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#90caf9' : '#172b4d',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.mode === 'dark' ? '#e9f2ff' : '#0c66e4'
  },
  '&:visited': {
    color: theme.palette.mode === 'dark' ? '#90caf9' : '#172b4d'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px'
  }
}))

function ActiveCard() {
  const dispatch = useDispatch()
  const activeCard = useSelector(selectCurrentActiveCard)
  const isShowModalActiveCard = useSelector(selectIsShowModalActiveCard)
  const currentUser = useSelector(selectCurrentUser)
  const confirm = useConfirm()
  const board = useSelector(selectCurrentActiveBoard)
  const [loading, setLoading] = useState(false)

  const handleCloseModal = () => {
    dispatch(clearAndHideCurrentActiveCard())
  }

  const callApiUpdateCard = async (updateData) => {
    const updatedCard = await updateCardDetailsAPI(activeCard._id, updateData)
    dispatch(updateCurrentActiveCard(updatedCard))

    if (activeCard.parentCardId) {
      let parentCard = findCardInBoard(board, activeCard.parentCardId)
      if (parentCard) {
        const updatedSubCards = updateSubCardInTree(parentCard.subCards, updatedCard)
        const updatedParentCard = { ...parentCard, subCards: updatedSubCards }
        dispatch(updateCardInBoard(updatedParentCard))
      }
    } else {
      dispatch(updateCardInBoard(updatedCard))
    }

    return updatedCard
  }

  const findCardInBoard = (board, cardId) => {
    if (!board || !board.columns) return null
    for (const column of board.columns) {
      if (!column.cards) continue
      const foundCard = findCardInTree(column.cards, cardId)
      if (foundCard) return foundCard
    }
    return null
  }

  const findCardInTree = (cards, cardId) => {
    if (!Array.isArray(cards)) return null
    for (const card of cards) {
      if (card._id === cardId) return card
      const found = findCardInTree(card.subCards, cardId)
      if (found) return found
    }
    return null
  }

  const updateSubCardInTree = (subCards, updatedSubCard) => {
    if (!Array.isArray(subCards)) return []
    return subCards.map(card => {
      if (card._id === updatedSubCard._id) {
        return { ...updatedSubCard }
      }
      return {
        ...card,
        subCards: updateSubCardInTree(card.subCards, updatedSubCard)
      }
    })
  }

  const onUpdateCardTitle = (newTitle) => {
    callApiUpdateCard({ title: newTitle })
      .then(() => {
        socketIoInstance.emit('FE_CARD_UPDATED', {
          boardId: activeCard.boardId,
          cardId: activeCard._id,
          columnId: activeCard.columnId,
          newTitle,
          parentCardId: activeCard.parentCardId || null
        })
      })
      .catch(() => {
        toast.error('Failed to update card title', { position: 'bottom-right' })
      })
  }

  const onUpdateCardDescription = (newDescription) => {
    callApiUpdateCard({ description: newDescription })
      .then((updatedCard) => {
        socketIoInstance.emit('FE_CARD_DESCRIPTION_UPDATED', {
          boardId: activeCard.boardId,
          cardId: activeCard._id,
          columnId: activeCard.columnId,
          newDescription: updatedCard.description,
          parentCardId: activeCard.parentCardId || null
        })
      })
      .catch(() => {
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
          event.target.value = ''
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
            parentCardId: activeCard.parentCardId || null,
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
        deleteCardDetailsAPI(activeCard._id).then(res => {
          toast.success(res?.deleteResult)
          if (activeCard.parentCardId) {
            const parentCard = findCardInBoard(board, activeCard.parentCardId)
            if (parentCard) {
              const updatedSubCards = removeSubCardFromTree(parentCard.subCards, activeCard._id)
              const updatedParentCard = { ...parentCard, subCards: updatedSubCards }
              dispatch(updateCurrentActiveCard(updatedParentCard))
              dispatch(updateCardInBoard(updatedParentCard))
              socketIoInstance.emit('FE_SUBCARD_DELETED', {
                boardId: activeCard.boardId,
                columnId: activeCard.columnId,
                cardId: activeCard._id,
                parentCardId: activeCard.parentCardId,
                actor: socketIoInstance.id
              })
            }
          } else {
            dispatch(deleteCardFromBoard({
              cardId: activeCard._id,
              columnId: activeCard.columnId
            }))
            socketIoInstance.emit('FE_CARD_DELETED', {
              boardId: activeCard.boardId,
              columnId: activeCard.columnId,
              cardId: activeCard._id,
              actor: socketIoInstance.id
            })
          }
          dispatch(clearAndHideCurrentActiveCard())
        }).catch(() => {
          toast.error('Failed to delete card')
        })
      })
      .catch(() => {})
  }

  const onUploadCardAttachment = async (event) => {
    const files = Array.from(event.target?.files || [])
    const errors = files.map(file => attachmentFileValidator(file)).filter(error => error)
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }
    let reqData = new FormData()
    files.forEach(file => reqData.append('attachments', file))

    setLoading(true)
    toast.promise(
      callApiUpdateCard(reqData)
        .then(updatedCard => {
          socketIoInstance.emit('FE_ATTACHMENT_ADDED', {
            boardId: activeCard.boardId,
            cardId: activeCard._id,
            columnId: activeCard.columnId,
            attachments: updatedCard.attachments.slice(-files.length),
            parentCardId: activeCard.parentCardId || null,
            actor: socketIoInstance.id
          })
          return updatedCard
        })
        .finally(() => {
          event.target.value = ''
          setLoading(false)
        }),
      { pending: 'Uploading...' }
    )
  }

  const onDeleteAttachment = (attachmentUrl) => {
    confirm({
      title: 'Delete Attachment?',
      description: 'This action will permanently delete this attachment. Are you sure?',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel'
    })
      .then(async () => {
        setLoading(true)
        try {
          await toast.promise(
            callApiUpdateCard({ attachmentToRemove: attachmentUrl }),
            {
              pending: 'Removing attachment...',
              success: 'Attachment removed!',
              error: 'Failed to remove attachment'
            }
          )
          socketIoInstance.emit('FE_ATTACHMENT_DELETED', {
            boardId: activeCard.boardId,
            cardId: activeCard._id,
            columnId: activeCard.columnId,
            attachmentUrl,
            parentCardId: activeCard.parentCardId || null,
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

  const handleOpenSubCard = (subCardId) => {
    const subCard = findCardInBoard(board, subCardId)
    if (subCard) {
      dispatch(updateCurrentActiveCard({ ...cloneDeep(subCard), parentCardId: activeCard._id }))
      dispatch(showModalActiveCard())
    } else {
      toast.error('Sub-card not found or has been deleted!')
    }
  }

  const handleDeleteSubCard = async (subCard) => {
    if (!board.ownerIds.includes(currentUser._id) && !board.memberIds.includes(currentUser._id)) {
      toast.error('You do not have permission to delete sub-cards')
      return
    }
    confirm({
      title: 'Delete Sub-Card?',
      description: 'This action will permanently delete this sub-card and all its nested sub-cards. Are you sure?',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel'
    })
      .then(async () => {
        try {
          await deleteCardDetailsAPI(subCard._id)
          const updatedSubCards = removeSubCardFromTree(activeCard.subCards, subCard._id)
          dispatch(updateCurrentActiveCard({ ...activeCard, subCards: updatedSubCards }))
          dispatch(updateCardInBoard({ ...activeCard, subCards: updatedSubCards }))
          socketIoInstance.emit('FE_SUBCARD_DELETED', {
            boardId: activeCard.boardId,
            columnId: activeCard.columnId,
            cardId: subCard._id,
            parentCardId: activeCard._id,
            actor: socketIoInstance.id
          })
          toast.success('Sub-card deleted!')
        } catch (err) {
          toast.error('Failed to delete sub-card')
        }
      })
      .catch(() => {})
  }

  const removeSubCardFromTree = (subCards, cardIdToRemove) => {
    if (!subCards) return []
    return subCards
      .filter(card => card._id !== cardIdToRemove)
      .map(card => ({
        ...card,
        subCards: removeSubCardFromTree(card.subCards, cardIdToRemove)
      }))
  }

  return (
    <Modal
      disableScrollLock
      open={isShowModalActiveCard}
      sx={{ overflowY: 'auto' }}
    >
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

        {activeCard?.cover && (
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
        )}

        <Box sx={{ mb: { xs: 1, sm: 1 }, mt: { xs: 0.5, sm: -3 }, pr: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon />
          <ToggleFocusInput
            id={`toggle-focus-input-${activeCard?._id}`}
            inputFontSize={{ xs: '20px', sm: '22px' }}
            value={activeCard?.title}
            onChangedValue={onUpdateCardTitle}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid xs={12} sm={8}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: '600', color: 'primary.main', mb: 1 }}>Members</Typography>
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
              <CardDescriptionMdEditor
                cardDescriptionProp={activeCard?.description}
                handleUpdateCardDescription={onUpdateCardDescription}
              />
            </Box>

            {activeCard?.subCards?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CreditCardIcon />
                  <Typography variant="span" sx={{ fontWeight: '600', fontSize: { xs: '16px', sm: '20px' } }}>
                    Sub-Card
                  </Typography>
                </Box>
                <SubCardTree
                  subCards={activeCard.subCards}
                  handleOpenSubCard={handleOpenSubCard}
                  handleDeleteSubCard={handleDeleteSubCard}
                />
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DvrOutlinedIcon />
                <Typography variant="span" sx={{ fontWeight: '600', fontSize: { xs: '16px', sm: '20px' } }}>Activity</Typography>
              </Box>
              <CardActivitySection
                cardComments={activeCard?.comments}
                onAddCardComment={onAddCardComment}
                cardId={activeCard?._id}
                boardId={board?._id}
                cardUtils={{ findCardInBoard, findCardInTree, updateSubCardInTree }}
              />
            </Box>
          </Grid>

          <Grid xs={12} sm={4}>
            <Typography sx={{ fontWeight: '600', color: 'primary.main', mb: 1 }}>Add To Card</Typography>
            <Stack direction="column" spacing={1}>
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
            </Stack>
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
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  )
}

export default ActiveCard