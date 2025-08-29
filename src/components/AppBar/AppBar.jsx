import Box from '@mui/material/Box'
import ModeSelect from '~/components/ModeSelect/ModeSelect'
import AppsIcon from '@mui/icons-material/Apps'
import { ReactComponent as TrelloIcon } from '~/assets/mdi--trello.svg'
import SvgIcon from '@mui/icons-material/Apps'
import Typography from '@mui/material/Typography'
import Workspaces from './Menus/Workspaces'
import Recent from './Menus/Recent'
import Started from './Menus/Started'
import Templates from './Menus/Templates'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Profiles from './Menus/Profiles'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import { Link } from 'react-router-dom'
import Notifications from './Notifications/Notifications'
import AutoCompleteSearchBoard from './SearchBoards/AutoCompleteSearchBoard'
import { useSelector } from 'react-redux'
import { selectCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'

function AppBar() {
  const currentActiveBoard = useSelector(selectCurrentActiveBoard)

  // Xác định đường dẫn cho logo: nếu có board hiện tại, dùng boardId, nếu không, về /boards
  const logoLink = currentActiveBoard?._id ? `/boards/${currentActiveBoard._id}` : '/boards'

  return (
    <Box sx={{
      width: '100%',
      height: (theme) => theme.taskManager.appBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      paddingX: 2,
      overflowX: 'auto',
      '&::-webkit-scrollbar-track': { m: 2 },
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2c3e50' : '#1565c0')
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link to='/boards'>
          <Tooltip title='Board List'>
            <AppsIcon sx={{ color: 'white', verticalAlign: 'middle' }}/>
          </Tooltip>
        </Link>
        <Link to={logoLink}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SvgIcon component={TrelloIcon} inheritViewBox fontSize='small' sx={{ color: 'white' }}/>
            <Typography variant='span' sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>Joji</Typography>
          </Box>
        </Link>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          <Workspaces/>
          <Recent/>
          <Started/>
          <Templates/>
          <Button
            startIcon={<AddBoxOutlinedIcon/>}
            sx={{ color: 'white' }}
          >
            Create
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Tìm kiếm nhanh một hoặc nhiều board */}
        <AutoCompleteSearchBoard/>

        {/* Dark, light, system modes */}
        <ModeSelect/>

        {/* Xử lý hiển thị các thông báo */}
        <Notifications />

        <Tooltip title="Help">
          <HelpOutlineIcon sx={{ cursor: 'pointer', color: 'white' }}/>
        </Tooltip>

        <Profiles/>
      </Box>
    </Box>
  )
}

export default AppBar