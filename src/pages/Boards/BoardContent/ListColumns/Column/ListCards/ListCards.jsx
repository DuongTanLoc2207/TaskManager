
import Box from '@mui/material/Box'
import Card from './Card/Card'
import { useSelector } from 'react-redux'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

function ListCards({ cards }) {
  const isCtrlPressed = useSelector(state => state.activeBoard.isCtrlPressed)
  const isSubCardMode = useSelector(state => state.activeBoard.isSubCardMode)

  return (
    <SortableContext items={(isCtrlPressed || isSubCardMode) ? [] : cards?.map(c => c._id)} strategy={verticalListSortingStrategy}>
      <Box sx={{
        p: '0 5px 5px 5px',
        m: '0 5px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflowX: 'hidden',
        overflowY: 'auto',
        maxHeight: (theme) => `calc(
          ${theme.taskManager.boardContentHeight} - 
          ${theme.spacing(5)} -
          ${theme.taskManager.columnHeaderHeight} -
          ${theme.taskManager.columnFooterHeight} 
        )`,
        '&::-webkit-scrollbar-thumb': { backgroundColor:'#ced0da' },
        '&::-webkit-scrollbar-thumb:hover': { backgroundColor:'#bfc2cf' }
      }}>
        {cards?.map(card => <Card key={card._id} card={card} />)}
      </Box>
    </SortableContext>
  )
}

export default ListCards