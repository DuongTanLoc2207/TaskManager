import { useState, useEffect, useRef } from 'react'
import AppBar from '~/components/AppBar/AppBar'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Unstable_Grid2'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import ListAltIcon from '@mui/icons-material/ListAlt'
import HomeIcon from '@mui/icons-material/Home'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'
import PaginationItem from '@mui/material/PaginationItem'
import { Link, useLocation } from 'react-router-dom'
import randomColor from 'randomcolor'
import SidebarCreateBoardModal from './create'
import { fetchBoardsAPI, updateBoardDetailsAPI } from '~/apis'
import { styled } from '@mui/material/styles'
import { DEFAULT_PAGE, DEFAULT_ITEMS_PER_PAGE } from '~/utils/constants'
import { toast } from 'react-toastify'
import { useConfirm } from 'material-ui-confirm'

// ⬇️ Thêm các import phục vụ dropdown giống Column
import Tooltip from '@mui/material/Tooltip'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import DeleteIcon from '@mui/icons-material/Delete'

// Styles Sidebar item menu
const SidebarItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  padding: '12px 16px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#33485D' : theme.palette.grey[300]
  },
  '&.active': {
    color: theme.palette.mode === 'dark' ? '#90caf9' : '#0c66e4',
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#e9f2ff'
  }
}))

function Boards() {
  const [boards, setBoards] = useState(null)
  const [totalBoards, setTotalBoards] = useState(null)

  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const page = parseInt(query.get('page') || '1', 10)

  const confirmDeleteBoard = useConfirm()

  // dùng ref để lưu màu cho từng board, tránh gọi randomColor() mỗi lần render
  const colorsRef = useRef({})

  // State cho dropdown per-board (1 menu anchor dùng cho tất cả cards)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuBoardId, setMenuBoardId] = useState(null)
  const handleMenuOpen = (event, boardId) => {
    setAnchorEl(event.currentTarget)
    setMenuBoardId(boardId)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuBoardId(null)
  }

  const updateStateData = (res) => {
    setBoards(res.boards || [])
    setTotalBoards(res.totalBoards || 0)
  }

  useEffect(() => {
    fetchBoardsAPI(location.search).then(updateStateData)
  }, [location.search])

  const afterCreateNewBoard = () => {
    fetchBoardsAPI(location.search).then(updateStateData)
  }

  // Hàm xóa board (soft delete với _destroy) + confirm
  const handleDeleteBoard = (boardId) => {
    confirmDeleteBoard({
      title: 'Delete board?',
      description: 'This action will permanently delete this board and all of its content.',
      confirmationText: 'Confirm',
      cancellationText: 'Cancel'
    })
      .then(async () => {
        await updateBoardDetailsAPI(boardId, { _destroy: true })
        toast.success('Board deleted successfully!')
        fetchBoardsAPI(location.search).then(updateStateData)
      })
      .catch(() => {})
  }

  if (!boards) {
    return <PageLoadingSpinner caption="Loading Boards..." />
  }

  return (
    <Container disableGutters maxWidth={false}>
      <AppBar />
      <Box sx={{ paddingX: 2, my: 4 }}>
        <Grid container spacing={2}>
          <Grid xs={12} sm={3}>
            <Stack direction="column" spacing={1}>
              <SidebarItem className="active">
                <SpaceDashboardIcon fontSize="small" />
                Boards
              </SidebarItem>
              <SidebarItem>
                <ListAltIcon fontSize="small" />
                Templates
              </SidebarItem>
              <SidebarItem>
                <HomeIcon fontSize="small" />
                Home
              </SidebarItem>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="column" spacing={1}>
              <SidebarCreateBoardModal afterCreateNewBoard={afterCreateNewBoard} />
            </Stack>
          </Grid>

          <Grid xs={12} sm={9}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Your boards:</Typography>

            {boards?.length === 0 &&
              <Typography variant="span" sx={{ fontWeight: 'bold', mb: 3 }}>No result found!</Typography>
            }

            {boards?.length > 0 &&
              <Grid container spacing={2}>
                {boards.map(b => {
                  // Lấy màu cố định cho board này, nếu chưa có thì tạo và lưu vào ref
                  const headerColor = colorsRef.current[b._id] ?? (colorsRef.current[b._id] = randomColor())

                  return (
                    <Grid xs={2} sm={3} md={4} key={b._id}>
                      <Card sx={{ width: '250px' }}>
                        {/* màu header giờ ổn định vì dùng colorsRef */}
                        <Box sx={{ height: '50px', backgroundColor: headerColor }}></Box>

                        <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 } }}>
                          {/* Header: title và icon More ngang hàng */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography gutterBottom variant="h6" component="div" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {b?.title}
                            </Typography>

                            <Tooltip title="More options">
                              <ExpandMoreIcon
                                sx={{ color: 'text.primary', cursor: 'pointer' }}
                                id={`board-menu-btn-${b._id}`}
                                aria-controls={menuBoardId === b._id && Boolean(anchorEl) ? `board-menu-${b._id}` : undefined}
                                aria-haspopup="true"
                                aria-expanded={menuBoardId === b._id && Boolean(anchorEl) ? 'true' : undefined}
                                onClick={(e) => handleMenuOpen(e, b._id)}
                              />
                            </Tooltip>
                          </Box>

                          {/* description */}
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', mt: 1 }}
                          >
                            {b?.description}
                          </Typography>

                          {/* footer: link to board */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                            <Box
                              component={Link}
                              to={`/boards/${b._id}`}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                color: 'primary.main',
                                '&:hover': { color: 'primary.light' }
                              }}>
                              Go to board <ArrowRightIcon fontSize="small" sx={{ ml: 0.5 }} />
                            </Box>
                          </Box>

                          {/* Menu (Delete nằm trong đây) */}
                          <Menu
                            id={`board-menu-${b._id}`}
                            anchorEl={anchorEl}
                            open={menuBoardId === b._id && Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            onClick={handleMenuClose}
                            MenuListProps={{ 'aria-labelledby': `board-menu-btn-${b._id}` }}
                          >
                            <MenuItem
                              onClick={() => handleDeleteBoard(b._id)}
                              sx={{
                                '&:hover': {
                                  color: 'warning.dark',
                                  '& .delete-icon': { color: 'warning.dark' }
                                }
                              }}
                            >
                              <ListItemIcon><DeleteIcon className='delete-icon' fontSize="small" /></ListItemIcon>
                              <ListItemText>Delete this board</ListItemText>
                            </MenuItem>
                          </Menu>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            }

            {(totalBoards > 0) &&
              <Box sx={{ my: 3, pr: 5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Pagination
                  size="large"
                  color="secondary"
                  showFirstButton
                  showLastButton
                  count={Math.ceil(totalBoards / DEFAULT_ITEMS_PER_PAGE)}
                  page={page}
                  renderItem={(item) => (
                    <PaginationItem
                      component={Link}
                      to={`/boards${item.page === DEFAULT_PAGE ? '' : `?page=${item.page}`}`}
                      {...item}
                    />
                  )}
                />
              </Box>
            }
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Boards
