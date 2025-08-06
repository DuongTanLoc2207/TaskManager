
import Box from '@mui/material/Box'
import Card from './Card/Card'

function ListCards() {
  return (
    <Box sx={{
      p: '0 5px',
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
      <Card/>
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
      <Card temporaryHireMedia />
    </Box>
  )
}

export default ListCards