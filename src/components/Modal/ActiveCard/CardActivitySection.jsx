import moment from 'moment'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { toast } from 'react-toastify'
import { deleteCommentAPI } from '~/apis'
import { socketIoInstance } from '~/socketClient'
import { selectCurrentActiveBoard, updateCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'
import { useConfirm } from 'material-ui-confirm'
import { useDispatch } from 'react-redux'
import { updateCurrentActiveCard, selectCurrentActiveCard } from '~/redux/activeCard/activeCardSlice'

function CardActivitySection({ cardComments=[], onAddCardComment, cardId, boardId, cardUtils }) {
  const { findCardInBoard, updateSubCardInTree } = cardUtils
  const currentUser = useSelector(selectCurrentUser)
  const board = useSelector(selectCurrentActiveBoard)
  const currentCard = useSelector(selectCurrentActiveCard)
  const confirm = useConfirm()
  const dispatch = useDispatch()

  const handleAddCardComment = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!event.target?.value) return

      const commentToAdd = {
        userId: currentUser?._id,
        userAvatar: currentUser?.avatar,
        userDisplayName: currentUser?.displayName,
        content: event.target.value.trim()
      }
      onAddCardComment(commentToAdd).then((createdComment) => {
        event.target.value = ''

        const updatedCard = {
          ...currentCard,
          comments: [createdComment, ...(currentCard.comments || [])]
        }
        dispatch(updateCurrentActiveCard(updatedCard))
        if (currentCard.parentCardId) {
          const parentCard = findCardInBoard(board, currentCard.parentCardId)
          if (parentCard) {
            const updatedSubCards = updateSubCardInTree(parentCard.subCards, updatedCard)
            const updatedParentCard = { ...parentCard, subCards: updatedSubCards }
            dispatch(updateCurrentActiveBoard({
              ...board,
              columns: board.columns.map(col => ({
                ...col,
                cards: col.cards.map(card =>
                  card._id === parentCard._id ? updatedParentCard : card
                )
              }))
            }))
          }
        } else {
          dispatch(updateCurrentActiveBoard({
            ...board,
            columns: board.columns.map(col => ({
              ...col,
              cards: col.cards.map(card =>
                card._id === cardId ? updatedCard : card
              )
            }))
          }))
        }

        socketIoInstance.emit('FE_COMMENT_ADDED', {
          boardId,
          cardId,
          comment: createdComment,
          parentCardId: currentCard.parentCardId || null,
          actor: socketIoInstance.id
        })
      })
    }
  }

  const handleDeleteComment = (commentId) => {
    confirm({
      title: 'Delete comment?',
      description: 'This comment will be permanently removed.',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel'
    })
      .then(async () => {
        try {
          await deleteCommentAPI(cardId, commentId)
          toast.success('Comment deleted successfully!')

          const updatedComments = cardComments.filter(c => c._id !== commentId)

          const updatedCard = {
            ...currentCard,
            comments: updatedComments
          }

          dispatch(updateCurrentActiveCard(updatedCard))
          if (currentCard.parentCardId) {
            const parentCard = findCardInBoard(board, currentCard.parentCardId)
            if (parentCard) {
              const updatedSubCards = updateSubCardInTree(parentCard.subCards, updatedCard)
              const updatedParentCard = { ...parentCard, subCards: updatedSubCards }
              dispatch(updateCurrentActiveBoard({
                ...board,
                columns: board.columns.map(col => ({
                  ...col,
                  cards: col.cards.map(card =>
                    card._id === parentCard._id ? updatedParentCard : card
                  )
                }))
              }))
            }
          } else {
            dispatch(updateCurrentActiveBoard({
              ...board,
              columns: board.columns.map(col => ({
                ...col,
                cards: col.cards.map(card =>
                  card._id === cardId ? updatedCard : card
                )
              }))
            }))
          }

          socketIoInstance.emit('FE_COMMENT_DELETED', {
            boardId,
            cardId,
            commentId,
            parentCardId: currentCard.parentCardId || null,
            actor: socketIoInstance.id
          })
        } catch (error) {
          toast.error('Failed to delete comment!')
        }
      })
      .catch(() => {})
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar
          sx={{
            width: { xs: 28, sm: 36 },
            height: { xs: 28, sm: 36 },
            cursor: 'pointer'
          }}
          alt={currentUser?.displayName}
          src={currentUser?.avatar}
        />
        <TextField
          fullWidth
          placeholder="Write a comment..."
          type="text"
          variant="outlined"
          multiline
          size="small"
          onKeyDown={handleAddCardComment}
        />
      </Box>

      {/* Hiển thị danh sách các comments */}
      {cardComments.length === 0 &&
        <Typography sx={{ pl: { xs: '36px', sm: '45px' }, fontSize: { xs: '12px', sm: '14px' }, fontWeight: '500', color: '#b1b1b1' }}>No activity found!</Typography>
      }
      {cardComments.map((comment) =>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', mb: 1.5 }} key={comment._id}>
          <Tooltip title={comment?.userDisplayName}>
            <Avatar
              sx={{ width: { xs: 28, sm: 36 }, height: { xs: 28, sm: 36 }, cursor: 'pointer' }}
              alt={comment?.userDisplayName}
              src={comment.userAvatar}
            />
          </Tooltip>
          <Box sx={{ width: 'inherit' }}>
            <Typography variant="span" sx={{ fontWeight: 'bold', mr: 1, fontSize: { xs: '13px', sm: '14px' } }}>
              {comment.userDisplayName}
            </Typography>

            <Typography variant="span" sx={{ fontSize: { xs: '10px', sm: '12px' } }}>
              {moment(comment.commentedAt).format('llll')}
            </Typography>

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#33485D' : 'white',
              p: '8px 12px',
              mt: '4px',
              border: '0.5px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              wordBreak: 'break-word',
              boxShadow: '0 0 1px rgba(0, 0, 0, 0.2)',
              fontSize: { xs: '12px', sm: '14px' }
            }}>
              <Typography variant="span">{comment.content}</Typography>
              {(comment.userId === currentUser._id || currentUser._id === board.ownerIds?.[0]) && (
                <Tooltip title="Delete comment">
                  <DeleteOutlineOutlinedIcon
                    sx={{ cursor: 'pointer', color: 'error.main' }}
                    fontSize="small"
                    onClick={() => handleDeleteComment(comment._id)}
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default CardActivitySection
