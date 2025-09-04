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
// import ListAltIcon from '@mui/icons-material/ListAlt'
// import HomeIcon from '@mui/icons-material/Home'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Pagination from '@mui/material/Pagination'
import PaginationItem from '@mui/material/PaginationItem'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import randomColor from 'randomcolor'
import SidebarCreateBoardModal from './create'
import { fetchBoardsAPI, updateBoardDetailsAPI } from '~/apis'
import { styled } from '@mui/material/styles'
import { DEFAULT_PAGE, DEFAULT_ITEMS_PER_PAGE } from '~/utils/constants'
import { toast } from 'react-toastify'
import { useConfirm } from 'material-ui-confirm'
import ToggleFocusInput from '~/components/Form/ToggleFocusInput'
import Tooltip from '@mui/material/Tooltip'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import DeleteIcon from '@mui/icons-material/Delete'
import { socketIoInstance } from '~/socketClient'

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
  },
  [theme.breakpoints.down('sm')]: {
    padding: '8px 10px',
    fontSize: '14px'
  }
}))

function Boards() {
  const [boards, setBoards] = useState(null)
  const [totalBoards, setTotalBoards] = useState(null)
  const [loading, setLoading] = useState(true)

  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const page = parseInt(query.get('page') || '1', 10)

  const navigate = useNavigate()

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
    setLoading(true)
    fetchBoardsAPI(location.search)
      .then(updateStateData)
      .finally(() => setLoading(false))

    socketIoInstance.on('BE_BOARD_UPDATED', (data) => {
      setBoards(prev =>
        prev.map(b =>
          b._id === data.boardId
            ? {
              ...b,
              title: data.newTitle ?? b.title, // Giữ nguyên title nếu không có newTitle
              description: data.newDescription ?? b.description // Giữ nguyên description nếu không có newDescription
            }
            : b
        )
      )
    })

    socketIoInstance.on('BE_BOARD_DELETED', (data) => {
      setBoards(prev => {
        const newBoards = prev.filter(b => b._id !== data.boardId)
        // Nếu danh sách boards rỗng và không phải trang 1, chuyển về trang trước hoặc trang 1
        if (newBoards.length === 0 && page > 1) {
          const newPage = page - 1
          navigate(`/boards${newPage === DEFAULT_PAGE ? '' : `?page=${newPage}`}`)
        }
        return newBoards
      })
      setTotalBoards(prev => prev - 1)
    })

    socketIoInstance.on('BE_USER_REMOVED_FROM_BOARD', () => {
      setLoading(true)
      fetchBoardsAPI(location.search)
        .then(res => {
          updateStateData(res)
        })
        .catch(() => {
          toast.error('Error refreshing the boards list!')
        })
        .finally(() => setLoading(false))
    })

    return () => {
      socketIoInstance.off('BE_BOARD_UPDATED')
      socketIoInstance.off('BE_BOARD_DELETED')
      socketIoInstance.off('BE_USER_REMOVED_FROM_BOARD')
    }
  }, [location.search, navigate, page])

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
        fetchBoardsAPI(location.search).then((res) => {
          updateStateData(res)
          // Nếu danh sách boards rỗng sau khi xóa và không phải trang 1, chuyển về trang trước hoặc trang 1
          if (res.boards.length === 0 && page > 1) {
            const newPage = page - 1
            navigate(`/boards${newPage === DEFAULT_PAGE ? '' : `?page=${newPage}`}`)
          }
        })
        socketIoInstance.emit('FE_BOARD_DELETED', {
          boardId,
          actor: socketIoInstance.id
        })
      })
      .catch(() => {})
  }

  const handleUpdateBoard = async (boardId, data) => {
    try {
      const trimmedData = {}
      if (data.title) trimmedData.title = data.title.trim()
      if (data.description) trimmedData.description = data.description.trim()

      // Chỉ gửi API nếu có dữ liệu thay đổi
      if (Object.keys(trimmedData).length === 0) return

      const updatedBoard = await updateBoardDetailsAPI(boardId, trimmedData)

      // Cập nhật state local, chỉ merge các trường thực sự được trả về từ API
      setBoards(prev =>
        prev.map(b =>
          b._id === boardId
            ? {
              ...b,
              title: updatedBoard.title ?? b.title, // Giữ nguyên title nếu API không trả về
              description: updatedBoard.description ?? b.description // Giữ nguyên description nếu API không trả về
            }
            : b
        )
      )

      // Emit sự kiện socket chỉ với các trường thay đổi
      if (trimmedData.title || trimmedData.description) {
        socketIoInstance.emit('FE_BOARD_UPDATED', {
          boardId,
          newTitle: trimmedData.title ?? undefined, // Chỉ gửi title nếu có thay đổi
          newDescription: trimmedData.description ?? undefined, // Chỉ gửi description nếu có thay đổi
          actor: socketIoInstance.id
        })
      }

      toast.success('Board updated successfully!')
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading || !boards) {
    return <PageLoadingSpinner caption="Loading Boards..." />
  }

  return (
    <Container disableGutters maxWidth={false}>
      <AppBar />
      <Box sx={{ px: 2, my: { xs: 2, sm: 4 } }}>
        <Grid container spacing={2}>
          <Grid xs={12} sm={3}>
            <Stack direction="column" spacing={1}>
              <SidebarItem className="active">
                <SpaceDashboardIcon fontSize="small" />
                Boards
              </SidebarItem>
              {/* <SidebarItem>
                <ListAltIcon fontSize="small" />
                Templates
              </SidebarItem>
              <SidebarItem>
                <HomeIcon fontSize="small" />
                Home
              </SidebarItem> */}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="column" spacing={1}>
              <SidebarCreateBoardModal afterCreateNewBoard={afterCreateNewBoard} />
            </Stack>
          </Grid>

          <Grid xs={12} sm={9}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 3,
                fontSize: { xs: '24px', sm: '32px' },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              Your boards
            </Typography>

            {boards?.length === 0 &&
              <Typography variant="span" sx={{ fontWeight: 'bold', mb: 3 }}>No result found!</Typography>
            }

            {boards?.length > 0 &&
              <Grid container spacing={2} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                {boards.map(b => {
                  // Lấy màu cố định cho board này, nếu chưa có thì tạo và lưu vào ref
                  const headerColor = colorsRef.current[b._id] ?? (colorsRef.current[b._id] = randomColor())

                  return (
                    <Grid xs="auto" sm={6} md={4} key={b._id} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Card sx={{ width: { xs: '90%', sm: 250 }, maxWidth: 250 }}>
                        {/* màu header giờ ổn định vì dùng colorsRef */}
                        <Box sx={{ height: '50px', backgroundColor: headerColor }}></Box>

                        <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 } }}>
                          {/* Header: title và icon More ngang hàng */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            {/* Title editable */}
                            <ToggleFocusInput
                              id={`board-title-${b._id}`}
                              value={b?.title}
                              inputFontSize={{ xs: '16px', sm: '18px' }}
                              inputFontWeight="500"
                              onChangedValue={(newTitle) => handleUpdateBoard(b._id, { title: newTitle })}
                            />

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

                          {/* Description editable */}
                          <ToggleFocusInput
                            id={`board-desc-${b._id}`}
                            value={b?.description || ''}
                            inputFontSize={{ xs: '12px', sm: '14px' }}
                            inputFontWeight="400"
                            onChangedValue={(newDesc) => handleUpdateBoard(b._id, { description: newDesc })}
                          />

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
              <Box sx={{ my: 3, pr: { xs: 0, sm: 5 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
