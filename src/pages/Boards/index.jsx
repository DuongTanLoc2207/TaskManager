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

  const colorsRef = useRef({})

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
              title: data.newTitle ?? b.title,
              description: data.newDescription ?? b.description
            }
            : b
        )
      )
    })

    socketIoInstance.on('BE_BOARD_DELETED', (data) => {
      setBoards(prev => {
        const newBoards = prev.filter(b => b._id !== data.boardId)
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
      if (Object.keys(trimmedData).length === 0) return

      const updatedBoard = await updateBoardDetailsAPI(boardId, trimmedData)

      setBoards(prev =>
        prev.map(b =>
          b._id === boardId
            ? {
              ...b,
              title: updatedBoard.title ?? b.title,
              description: updatedBoard.description ?? b.description
            }
            : b
        )
      )

      if (trimmedData.title || trimmedData.description) {
        socketIoInstance.emit('FE_BOARD_UPDATED', {
          boardId,
          newTitle: trimmedData.title ?? undefined,
          newDescription: trimmedData.description ?? undefined,
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
                  const headerColor = colorsRef.current[b._id] ?? (colorsRef.current[b._id] = randomColor())

                  return (
                    <Grid xs="auto" sm={6} md={4} key={b._id} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Card sx={{ width: { xs: '90%', sm: 250 }, maxWidth: 250 }}>
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

                          {/* Delete */}
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
