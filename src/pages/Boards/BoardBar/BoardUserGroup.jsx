import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
import MenuItem from '@mui/material/MenuItem'
import { socketIoInstance } from '~/socketClient'
import { toast } from 'react-toastify'

function BoardUserGroup({ boardUsers = [], limit = 6, ownerIds = [], currentUserId, onUpdateBoardUsers, boardId }) {
  const [anchorPopoverElement, setAnchorPopoverElement] = useState(null)
  const isOpenPopover = Boolean(anchorPopoverElement)
  const popoverId = isOpenPopover ? 'board-all-users-popover' : undefined
  const navigate = useNavigate()

  const handleTogglePopover = (event) => {
    if (!anchorPopoverElement) setAnchorPopoverElement(event.currentTarget)
    else setAnchorPopoverElement(null)
  }

  // State cho popup xóa user
  const [anchorUserPopover, setAnchorUserPopover] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const handleClickUser = (event, user) => {
    const ownerSet = new Set(ownerIds || [])
    const isSelectedOwner = ownerSet.has(user._id)
    const isCurrentUserOwner = currentUserId && ownerSet.has(currentUserId)
    const isSelf = user._id === currentUserId

    const canRemove = (() => {
      if (isSelf) {
        return !isSelectedOwner // tự rời nếu không phải owner
      } else {
        return isCurrentUserOwner // chỉ owner mới xóa người khác
      }
    })()

    // Owner clicking on themselves => do nothing
    if (isSelf && isSelectedOwner) return

    if (!canRemove) {
      return
    }

    setAnchorUserPopover(event.currentTarget)
    setSelectedUser(user)
  }

  const handleCloseUserPopover = () => {
    setAnchorUserPopover(null)
    setSelectedUser(null)
  }

  const handleRemoveUser = () => {
    if (!selectedUser) return

    const isSelf = selectedUser._id === currentUserId
    const incomingMemberInfo = {
      userId: selectedUser?._id,
      action: 'REMOVE'
    }
    try {
      onUpdateBoardUsers(incomingMemberInfo)

      // Phát sự kiện socket
      socketIoInstance.emit('FE_USER_REMOVED_FROM_BOARD', {
        boardId: boardId,
        userId: selectedUser._id,
        removedBy: currentUserId,
        isSelf
      })

      if (isSelf) {
        toast.success('Bạn đã rời khỏi board!')
        navigate('/boards')
      } else {
        toast.success(`Đã xóa ${selectedUser.displayName} khỏi board!`)
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa thành viên. Vui lòng thử lại!')
    }

    handleCloseUserPopover()
  }

  const renderPopoverLabel = () => {
    if (!selectedUser) return ''
    const isSelf = selectedUser._id === currentUserId

    return isSelf
      ? 'Leave board'
      : `Remove ${selectedUser.displayName} from board`
  }

  return (
    <Box sx={{ display: 'flex', gap: '4px' }}>
      {/* Hiển thị giới hạn số lượng user */}
      {boardUsers.map((user, index) => {
        if (index < limit) {
          return (
            <Tooltip title={user?.displayName} key={index}>
              <Avatar
                sx={{
                  width: { xs: 28, sm: 32, md: 34 },
                  height: { xs: 28, sm: 32, md: 34 },
                  cursor: 'pointer'
                }}
                alt={user?.displayName}
                src={user?.avatar}
                onClick={(e) => handleClickUser(e, user)}
              />
            </Tooltip>
          )
        }
      })}

      {/* Nếu nhiều hơn limit thì hiện nút + */}
      {boardUsers.length > limit &&
        <Tooltip title="Show more">
          <Box
            aria-describedby={popoverId}
            onClick={handleTogglePopover}
            sx={{
              width: { xs: 28, sm: 32, md: 36 },
              height: { xs: 28, sm: 32, md: 36 },
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
              fontWeight: '500',
              borderRadius: '50%',
              color: 'white',
              backgroundColor: '#a4b0be'
            }}
          >
            +{boardUsers.length - limit}
          </Box>
        </Tooltip>
      }

      {/* Popover cũ hiển thị toàn bộ users */}
      <Popover
        id={popoverId}
        open={isOpenPopover}
        anchorEl={anchorPopoverElement}
        onClose={handleTogglePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{
          p: 2,
          maxWidth: { xs: '180px', sm: '235px' },
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1
        }}>
          {boardUsers.map((user, index) =>
            <Tooltip title={user?.displayName} key={index}>
              <Avatar
                sx={{
                  width: { xs: 28, sm: 32, md: 34 },
                  height: { xs: 28, sm: 32, md: 34 },
                  cursor: 'pointer'
                }}
                alt={user?.displayName}
                src={user?.avatar}
                onClick={(e) => handleClickUser(e, user)}
              />
            </Tooltip>
          )}
        </Box>
      </Popover>

      {/* Popover phụ để xác nhận xóa user */}
      <Popover
        open={Boolean(anchorUserPopover)}
        anchorEl={anchorUserPopover}
        onClose={handleCloseUserPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MenuItem
          onClick={handleRemoveUser}
          sx={{ color: 'red', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}
        >
          {renderPopoverLabel()}
        </MenuItem>
      </Popover>
    </Box>
  )
}

export default BoardUserGroup
