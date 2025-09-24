import { useEffect, useState } from 'react'
import moment from 'moment'
import Badge from '@mui/material/Badge'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import DoneIcon from '@mui/icons-material/Done'
import NotInterestedIcon from '@mui/icons-material/NotInterested'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInvitationsAPI,
  selectCurrentNotifications,
  updateBoardInvitationAPI,
  addNotification
} from '~/redux/notifications/notificationsSlice'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { socketIoInstance } from '~/socketClient'
import { useNavigate } from 'react-router-dom'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}

function Notifications() {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClickNotificationIcon = (event) => {
    setAnchorEl(event.currentTarget)
    setNewNotification(false)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const navigate = useNavigate()

  const notifications = useSelector(selectCurrentNotifications)

  const [newNotification, setNewNotification] = useState(false)

  const currentUser = useSelector(selectCurrentUser)

  const [filter, setFilter] = useState('ALL')

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'ALL') return true
    if (filter === 'PENDING') return n.boardInvitation.status === BOARD_INVITATION_STATUS.PENDING
    if (filter === 'RESPONDED') return n.boardInvitation.status !== BOARD_INVITATION_STATUS.PENDING
    return true
  })

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchInvitationsAPI()).then(res => {
      const pendingExists = res.payload?.some(
        inv => inv.boardInvitation?.status === BOARD_INVITATION_STATUS.PENDING
      )
      if (pendingExists) {
        setNewNotification(true)
      }
    })

    const onReceiveNewInvitation = (invitation) => {
      if (invitation.inviteeId === currentUser._id) {
        dispatch(addNotification(invitation))
        setNewNotification(true)
      }
    }

    const onBoardDeleted = () => {
      dispatch(fetchInvitationsAPI()).then(res => {
        const pendingExists = res.payload?.some(
          inv => inv.boardInvitation?.status === BOARD_INVITATION_STATUS.PENDING
        )
        setNewNotification(pendingExists)
      })
    }

    socketIoInstance.on('BE_USER_INVITED_TO_BOARD', onReceiveNewInvitation)
    socketIoInstance.on('BE_BOARD_DELETED', onBoardDeleted)
    return () => {
      socketIoInstance.off('BE_USER_INVITED_TO_BOARD', onReceiveNewInvitation)
      socketIoInstance.off('BE_BOARD_DELETED', onBoardDeleted)
    }
  }, [dispatch, currentUser._id])

  const updateBoardInvitation = (status, invitationId) => {
    dispatch(updateBoardInvitationAPI({ status, invitationId }))
      .then(res => {
        const invitation = res.payload.boardInvitation
        if (status === BOARD_INVITATION_STATUS.ACCEPTED) {
          navigate(`/boards/${invitation.boardId}`)
          socketIoInstance.emit('FE_ADD_USER_TO_BOARD', {
            boardId: invitation.boardId,
            userId: currentUser._id,
            inviteeEmail: currentUser.email,
            user: {
              _id: currentUser._id,
              displayName: currentUser.displayName || currentUser.email,
              avatar: currentUser.avatar || ''
            }
          })
        }
      })
  }

  return (
    <Box>
      <Tooltip title="Notifications">
        <Badge
          color="warning"
          variant={newNotification ? 'dot' : 'none'}
          sx={{ cursor: 'pointer' }}
          id="basic-button-open-notification"
          aria-controls={open ? 'basic-notification-drop-down' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClickNotificationIcon}
        >
          <NotificationsNoneIcon sx={{
            color: newNotification ? 'yellow' : 'white'
          }} />
        </Badge>
      </Tooltip>

      <Menu
        sx={{ mt: 2 }}
        id="basic-notification-drop-down"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            px: 0.5,
            py: 1,
            '& .MuiMenu-list': {
              maxHeight: 500,
              overflowY: 'auto',
              p: 0,
              pr: 1,
              outline: 'none',
              scrollbarGutter: 'stable',
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#d0d7de',
                borderRadius: '8px'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#96a0aa',
                cursor: 'pointer'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f6f8fa'
              }
            }
          }
        }}
        MenuListProps={{ 'aria-labelledby': 'basic-button-open-notification' }}
      >
        <Tabs
          value={filter}
          onChange={(e, newValue) => setFilter(newValue)}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 1,
            '& .MuiTab-root': {
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' }
            } }}
        >
          <Tab label="All" value="ALL" />
          <Tab label="Pending" value="PENDING" />
          <Tab label="History" value="RESPONDED" />
        </Tabs>

        {filteredNotifications.length === 0 && (
          <MenuItem sx={{
            fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
          }}>You do not have any notifications.</MenuItem>
        )}

        {filteredNotifications.map((notification, index) =>
          <Box key={index}>
            <MenuItem sx={{
              width: '100%',
              fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' }
            }}>
              <Box sx={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Nội dung */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupAddIcon fontSize="small" />
                  <Box>
                    <strong>{notification.inviter?.displayName}</strong> invited you to join{' '}
                    <strong>{notification.board?.title}</strong>
                  </Box>
                </Box>

                {/* Nếu Pending thì hiện nút */}
                {notification.boardInvitation.status === BOARD_INVITATION_STATUS.PENDING && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => updateBoardInvitation(BOARD_INVITATION_STATUS.ACCEPTED, notification._id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => updateBoardInvitation(BOARD_INVITATION_STATUS.REJECTED, notification._id)}
                    >
                      Reject
                    </Button>
                  </Box>
                )}

                {/* Nếu đã xử lý thì hiện chip */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {notification.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED && (
                    <Chip icon={<DoneIcon />} label="Accepted" color="success" size="small" />
                  )}
                  {notification.boardInvitation.status === BOARD_INVITATION_STATUS.REJECTED && (
                    <Chip icon={<NotInterestedIcon />} label="Rejected" size="small" />
                  )}
                </Box>

                <Typography variant="span" sx={{
                  fontSize: { xs: '10px', sm: '12px' },
                  textAlign: 'right'
                }}>
                  {moment(notification.createdAt).format('llll')}
                </Typography>
              </Box>
            </MenuItem>
            {index !== filteredNotifications.length - 1 && <Divider />}
          </Box>
        )}
      </Menu>
    </Box>
  )
}

export default Notifications
