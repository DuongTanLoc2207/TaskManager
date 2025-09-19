import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import LockIcon from '@mui/icons-material/Lock'
import Typography from '@mui/material/Typography'
import { Card as MuiCard } from '@mui/material'
import { ReactComponent as Logo } from '~/assets/logo.svg'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import Zoom from '@mui/material/Zoom'
import Alert from '@mui/material/Alert'
import { useForm } from 'react-hook-form'
import {
  EMAIL_RULE,
  PASSWORD_RULE,
  FIELD_REQUIRED_MESSAGE,
  PASSWORD_RULE_MESSAGE,
  EMAIL_RULE_MESSAGE
} from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { useDispatch } from 'react-redux'
import { loginUserAPI } from '~/redux/user/userSlice'
import { toast } from 'react-toastify'
import { useState, useRef } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

function LoginForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const iconStyle = { color : '#636e72' }

  const { register, handleSubmit, formState: { errors } } = useForm()
  let [searchParams] = useSearchParams()
  const registeredEmail = searchParams.get('registeredEmail')
  const verifiedEmail = searchParams.get('verifiedEmail')

  const passwordRef = useRef(null)

  const submitLogIn = (data) => {
    const { email, password } = data

    toast.promise(
      dispatch(loginUserAPI({ email, password })),
      { pending: 'Logging in...' }
    ).then(res => {
      if (!res.error) navigate('/')
    })
  }

  const handleClickShowPassword = () => {
    if (passwordRef.current) {
      const input = passwordRef.current
      const cursorPos = input.selectionStart
      setShowPassword(prev => !prev)
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    } else {
      setShowPassword(prev => !prev)
    }
  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit(submitLogIn)}>
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <MuiCard sx={{
          width: { xs: 300, sm: 380, md: 400 },
          maxWidth: '100%',
          marginTop: '6em',
          mx: 'auto'
        }}>
          <Box sx={{
            margin: '1em',
            display: 'flex',
            justifyContent: 'center',
            gap: 1
          }}>
            <Avatar sx={{
              bgcolor: 'primary.main',
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 }
            }}><LockIcon sx={{ fontSize: { xs: '20px', sm: '24px', md: '28px' } }} /></Avatar>
            <Avatar sx={{
              bgcolor: 'primary.main',
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 }
            }}><Logo style={{ width: '80%', height: '80%' }} /></Avatar>
          </Box>
          <Box sx={{ marginTop: '1em', display: 'flex', justifyContent: 'center', flexDirection: 'column', padding: '0 1em' }}>
            {verifiedEmail &&
              <Alert severity="success" sx={{ '.MuiAlert-message': { overflow: 'hidden' }, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                Your email&nbsp;
                <Typography variant="span" sx={{ fontWeight: 'bold', '&:hover': { color: '#fdba26' }, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>{verifiedEmail}</Typography>
                &nbsp;has been verified.<br />Now you can login to enjoy our services! Have a good day!
              </Alert>
            }
            {registeredEmail &&
              <Alert severity="info" sx={{ '.MuiAlert-message': { overflow: 'hidden' }, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                An email has been sent to&nbsp;
                <Typography variant="span" sx={{ fontWeight: 'bold', '&:hover': { color: '#fdba26' }, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>{registeredEmail}</Typography>
                <br />Please check and verify your account before logging in!
              </Alert>
            }
          </Box>
          <Box sx={{ padding: '0 1em 1em 1em' }}>
            <Box sx={{ marginTop: '1em' }}>
              <TextField
                autoFocus
                fullWidth
                label="Enter Email..."
                type="text"
                variant="outlined"
                error={!!errors['email']}
                sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem' } } }}
                {...register('email', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: {
                    value: EMAIL_RULE,
                    message: EMAIL_RULE_MESSAGE
                  }
                })}
              />
              <FieldErrorAlert errors={errors} fieldName={'email'} />
            </Box>
            <Box sx={{ marginTop: '1em' }}>
              <TextField
                fullWidth
                label="Enter Password..."
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                error={!!errors['password']}
                sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem' } } }}
                inputRef={passwordRef}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        sx={{ minWidth: 'auto', p: 0 }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" sx={iconStyle} /> : <Visibility fontSize="small" sx={iconStyle} />}
                      </Button>
                    </InputAdornment>
                  )
                }}
                {...register('password', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: {
                    value: PASSWORD_RULE,
                    message: PASSWORD_RULE_MESSAGE
                  }
                })}
              />
              <FieldErrorAlert errors={errors} fieldName={'password'} />
            </Box>
          </Box>
          <CardActions sx={{ padding: '0 1em 1em 1em' }}>
            <Button
              className='interceptor-loading'
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              fullWidth
            >
              Login
            </Button>
          </CardActions>
          <Box sx={{ padding: '0 1em 1em 1em', textAlign: 'center' }}>
            <Typography>New to Joji?</Typography>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'primary.main', '&:hover': { color: '#ffbb39' } }}>Create account!</Typography>
            </Link>
          </Box>
        </MuiCard>
      </Zoom>
    </form>
  )
}

export default LoginForm
