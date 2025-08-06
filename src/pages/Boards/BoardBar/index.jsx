import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined'
import AddToDriveOutlinedIcon from '@mui/icons-material/AddToDriveOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import { Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'

const MENU_STYLES = {
  color: 'white',
  bgcolor: 'transparent',
  border: 'none',
  paddingX: '5px',
  borderRadius: '4px',
  '.MuiSvgIcon-root': {
    color: 'white'
  },
  '&:hover': {
    bgcolor: 'primary.50'
  }
}

function BoardBar() {
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
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
      borderBottom: '1px solid white'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          sx={MENU_STYLES}
          icon={<DashboardOutlinedIcon />}
          label="Joji Board"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<VpnLockOutlinedIcon />}
          label="Public/Private Workspace"
          clickable
        />
        <Chip
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
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          variant="outlined"
          startIcon={<PersonAddAltIcon/>}
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': { borderColor: 'white' }
          }}
        >
          Invite
        </Button>

        <AvatarGroup
          max={3}
          sx={{
            gap: '10px',
            '& .MuiAvatar-root': {
              width: 34,
              height: 34,
              fontSize: '16px',
              border: 'none'
            }
          }}
        >
          <Tooltip title='Joji'>
            <Avatar
              alt="Joji"
              src="https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/20975d452feac5b5f75d5ae30e90f54d~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=4c4d0cf4&x-expires=1754485200&x-signature=dVHjf%2F6zGzh8YOOHQYqMn89O3c8%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=sg1" />
          </Tooltip>
          <Tooltip title='Joji'>
            <Avatar
              alt="Joji"
              src="https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/20975d452feac5b5f75d5ae30e90f54d~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=4c4d0cf4&x-expires=1754485200&x-signature=dVHjf%2F6zGzh8YOOHQYqMn89O3c8%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=sg1" />
          </Tooltip>
          <Tooltip title='Joji'>
            <Avatar
              alt="Joji"
              src="https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/20975d452feac5b5f75d5ae30e90f54d~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=4c4d0cf4&x-expires=1754485200&x-signature=dVHjf%2F6zGzh8YOOHQYqMn89O3c8%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=sg1" />
          </Tooltip>
          <Tooltip title='Joji'>
            <Avatar
              alt="Joji"
              src="https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/20975d452feac5b5f75d5ae30e90f54d~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=4c4d0cf4&x-expires=1754485200&x-signature=dVHjf%2F6zGzh8YOOHQYqMn89O3c8%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=sg1" />
          </Tooltip>
        </AvatarGroup>
      </Box>

    </Box>
  )
}

export default BoardBar