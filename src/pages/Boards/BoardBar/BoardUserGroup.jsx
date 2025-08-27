import { useState } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
import MenuItem from '@mui/material/MenuItem'

function BoardUserGroup({ boardUsers = [], limit = 6, onUpdateBoardUsers }) {
  const [anchorPopoverElement, setAnchorPopoverElement] = useState(null)
  const isOpenPopover = Boolean(anchorPopoverElement)
  const popoverId = isOpenPopover ? 'board-all-users-popover' : undefined
  const handleTogglePopover = (event) => {
    if (!anchorPopoverElement) setAnchorPopoverElement(event.currentTarget)
    else setAnchorPopoverElement(null)
  }

  // State cho popup xóa user
  const [anchorUserPopover, setAnchorUserPopover] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const handleClickUser = (event, user) => {
    setAnchorUserPopover(event.currentTarget)
    setSelectedUser(user)
  }

  const handleCloseUserPopover = () => {
    setAnchorUserPopover(null)
    setSelectedUser(null)
  }

  const handleRemoveUser = () => {
    const incomingMemberInfo = {
      userId: selectedUser?._id,
      action: 'REMOVE'
    }
    onUpdateBoardUsers(incomingMemberInfo)
    handleCloseUserPopover()
  }

  return (
    <Box sx={{ display: 'flex', gap: '4px' }}>
      {/* Hiển thị giới hạn số lượng user */}
      {boardUsers.map((user, index) => {
        if (index < limit) {
          return (
            <Tooltip title={user?.displayName} key={index}>
              <Avatar
                sx={{ width: 34, height: 34, cursor: 'pointer' }}
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
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
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
        <Box sx={{ p: 2, maxWidth: '235px', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {boardUsers.map((user, index) =>
            <Tooltip title={user?.displayName} key={index}>
              <Avatar
                sx={{ width: 34, height: 34, cursor: 'pointer' }}
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
        <MenuItem onClick={handleRemoveUser} sx={{ color: 'red' }}>
          Xóa {selectedUser?.displayName} khỏi board
        </MenuItem>
      </Popover>
    </Box>
  )
}

export default BoardUserGroup
