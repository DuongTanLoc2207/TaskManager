import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined'
// import AddToDriveOutlinedIcon from '@mui/icons-material/AddToDriveOutlined'
// import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
// import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import { Tooltip } from '@mui/material'
import { capitalizeFirstLetter } from '~/utils/formatters'
import BoardUserGroup from './BoardUserGroup'
import InviteBoardUser from './InviteBoardUser'
import { useDispatch } from 'react-redux'
import { updateBoardInStore } from '~/redux/activeBoard/activeBoardSlice'
import { updateBoardDetailsAPI } from '~/apis'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
import { toast } from 'react-toastify'

const MENU_STYLES = {
  color: 'white',
  bgcolor: 'transparent',
  border: 'none',
  paddingX: { xs: '2px', sm: '5px' },
  borderRadius: '4px',
  fontSize: { xs: '0.8rem', sm: '0.8rem', md: '1rem' },
  '.MuiSvgIcon-root': {
    color: 'white',
    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }
  },
  '&:hover': {
    bgcolor: 'primary.50'
  }
}

function BoardBar({ board }) {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const handleUpdateBoardUsers = async (incomingMemberInfo) => {
    try {
      const updatedBoard = await updateBoardDetailsAPI(board._id, { incomingMemberInfo })
      dispatch(updateBoardInStore(updatedBoard))
    } catch (error) {
      toast.error('Failed to update board users!')
    }
  }

  return (
    <Box sx={{
      width: '100%',
      height: (theme) => theme.taskManager.boardBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      paddingX: 2,
      overflowX: 'auto',
      '&::-webkit-scrollbar-track': { m: 2 },
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2')
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5, md: 2 } }}>
        <Tooltip title={board?.description}>
          <Chip
            sx={MENU_STYLES}
            icon={<DashboardOutlinedIcon />}
            label={board?.title}
            clickable
          />
        </Tooltip>
        <Chip
          sx={MENU_STYLES}
          icon={<VpnLockOutlinedIcon />}
          label={capitalizeFirstLetter(board?.type)}
          clickable
        />
        {/* <Chip
          sx={MENU_STYLES}
          icon={<AddToDriveOutlinedIcon />}
          label="Add To Google Drive"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<BoltOutlinedIcon />}
          label="Automation"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<FilterListOutlinedIcon />}
          label="Filters"
          clickable
        /> */}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Xử lý mời user vào board */}
        <InviteBoardUser boardId={board._id} />

        {/* Xử lý hiển thị danh sách thành viên của board */}
        <BoardUserGroup
          boardUsers={board?.FE_allUsers}
          ownerIds={board?.ownerIds || (board?.owners || []).map(o => o._id)}
          currentUserId={currentUser?._id}
          onUpdateBoardUsers={handleUpdateBoardUsers}
          boardId={board?._id}
        />
      </Box>
    </Box>
  )
}

export default BoardBar