import { Card as MuiCard } from '@mui/material'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import GroupsIcon from '@mui/icons-material/Groups'
import CommentIcon from '@mui/icons-material/Comment'
import AttachmentIcon from '@mui/icons-material/Attachment'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDispatch, useSelector } from 'react-redux'
import { updateCurrentActiveCard, showModalActiveCard } from '~/redux/activeCard/activeCardSlice'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import { countSubCardsInTree } from '~/utils/cardUtils'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip'

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    fontSize: '0.75rem',
    padding: '6px 10px',
    borderRadius: '8px',
    boxShadow: '0px 2px 6px rgba(0,0,0,0.15)',
    fontWeight: 500
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.primary.main
  }
}))

function Card({ card }) {
  const dispatch = useDispatch()
  const overCardId = useSelector(state => state.activeBoard.overCardId)
  const isCtrlPressed = useSelector(state => state.activeBoard.isCtrlPressed)
  const isSubCardMode = useSelector(state => state.activeBoard.isSubCardMode)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { ...card }
  })

  const dndKitCardStyles = {
    touchAction: 'none',
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    border: isDragging ? '1px solid #3498db' : overCardId === card._id && (isCtrlPressed || isSubCardMode) ? '2px dashed #3498db': undefined,
    position: 'relative'
  }

  const shouldShowCardAction = () => {
    return !!card?.memberIds?.length || !!card?.comments?.length || !!card?.attachments?.length || !!card?.subCards?.length
  }

  const setActiveCard = () => {
    dispatch(updateCurrentActiveCard(card))
    dispatch(showModalActiveCard())
  }

  return (
    <MuiCard
      onClick={setActiveCard}
      ref={setNodeRef}
      style={dndKitCardStyles}
      {...attributes}
      {...listeners}
      sx={{
        cursor: 'pointer',
        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
        overflow: 'unset',
        display: card?.FE_PlaceholderCard ? 'none' : 'block',
        border: '1px solid transparent',
        '&:hover': { borderColor: (theme) => theme.palette.primary.main },
        position: 'relative'
      }}
    >
      {overCardId === card._id && (isCtrlPressed || isSubCardMode) && !card?.FE_PlaceholderCard && (
        <StyledTooltip
          title="Ctrl + Drop to make sub-card"
          placement="top"
          arrow
          open
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0
            }}
          />
        </StyledTooltip>
      )}

      {card?.cover && <CardMedia
        sx={{
          height: { xs: 100, sm: 120, md: 140 },
          objectFit: 'cover'
        }}
        image={card?.cover}/>}
      <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { p: { xs: 1, sm: 1.5 } } }}>
        <Typography
          noWrap
          sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >{card?.title}</Typography>
      </CardContent>
      {shouldShowCardAction() &&
        <CardActions
          sx={{
            p: { xs: '0 2px 6px 2px', sm: '0 4px 8px 4px' },
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            '& .MuiButton-root': {
              minWidth: 32,
              height: 28,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1
            }
          }}
        >
          {!!card?.memberIds?.length &&
            <Button size="small" startIcon={<GroupsIcon/>}>{card?.memberIds?.length}</Button>
          }
          {!!card?.comments?.length &&
            <Button size="small" startIcon={<CommentIcon/>}>{card?.comments?.length}</Button>
          }
          {!!card?.attachments?.length &&
            <Button size="small" startIcon={<AttachmentIcon/>}>{card?.attachments?.length}</Button>
          }
          {!!card?.subCards?.length && (
            <Button size="small" startIcon={<CreditCardIcon />}>
              {countSubCardsInTree(card.subCards)}
            </Button>
          )}
        </CardActions>
      }
    </MuiCard>
  )
}

export default Card