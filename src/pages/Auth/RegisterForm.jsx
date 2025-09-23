import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import Typography from '@mui/material/Typography'
import { Card as MuiCard } from '@mui/material'
import { ReactComponent as Logo } from '~/assets/logo.svg'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import Zoom from '@mui/material/Zoom'
import { useForm } from 'react-hook-form'
import {
  EMAIL_RULE,
  PASSWORD_RULE,
  FIELD_REQUIRED_MESSAGE,
  PASSWORD_RULE_MESSAGE,
  EMAIL_RULE_MESSAGE
} from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { registerUserAPI } from '~/apis'
import { toast } from 'react-toastify'
import { useState, useRef } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

function RegisterForm() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const iconStyle = { color : '#636e72' }

  const passwordRef = useRef(null)
  const confirmRef = useRef(null)

  const submitRegister = (data) => {
    const { email, password } = data
    toast.promise(
      registerUserAPI({ email, password }),
      { pending: 'Registration is in progress' }
    ).then(user => {
      navigate(`/login?registeredEmail=${user.email}`)
    })
  }

  const handleClickShowPassword = (field) => () => {
    let input
    if (field === 'password') input = passwordRef.current
    if (field === 'password_confirmation') input = confirmRef.current
    if (!input) return

    const cursorPos = input.selectionStart
    if (field === 'password') setShowPassword(prev => !prev)
    if (field === 'password_confirmation') setShowConfirmPassword(prev => !prev)

    setTimeout(() => {
      input.focus()
      input.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit(submitRegister)}>
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <MuiCard sx={{
          width: { xs: 320, sm: 360, md: 380 },
          maxWidth: '100%',
          marginTop: { xs: '4em', sm: '6em' }
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
            }}>
              <HowToRegIcon sx={{ fontSize: { xs: '18px', sm: '20px', md: '24px' } }} />
            </Avatar>
            <Avatar sx={{
              bgcolor: 'primary.main',
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 }
            }}>
              <Logo style={{ width: '80%', height: '80%' }} />
            </Avatar>
          </Box>
          <Box sx={{ padding: '0 1em 1em 1em' }}>
            <Box sx={{ marginTop: '1em' }}>
              <TextField
                // autoComplete="nope"
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
                        onClick={handleClickShowPassword('password')}
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
            <Box sx={{ marginTop: '1em' }}>
              <TextField
                fullWidth
                label="Enter Password Confirmation..."
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                error={!!errors['password_confirmation']}
                sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem' } } }}
                inputRef={confirmRef}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={handleClickShowPassword('password_confirmation')}
                        onMouseDown={handleMouseDownPassword}
                        sx={{ minWidth: 'auto', p: 0 }}
                      >
                        {showConfirmPassword ? <VisibilityOff fontSize="small" sx={iconStyle} /> : <Visibility fontSize="small" sx={iconStyle} />}
                      </Button>
                    </InputAdornment>
                  )
                }}
                {...register('password_confirmation', {
                  validate: (value) => {
                    if (value === watch('password')) return true
                    return 'Password Confirmation does not match!'
                  }
                })}
              />
              <FieldErrorAlert errors={errors} fieldName={'password_confirmation'} />
            </Box>
          </Box>
          <CardActions sx={{ padding: '0 1em 1em 1em' }}>
            <Button
              className='interceptor-loading'
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Register
            </Button>
          </CardActions>
          <Box sx={{ padding: '0 1em 1em 1em', textAlign: 'center' }}>
            <Typography >Already have an account?</Typography>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'primary.main', '&:hover': { color: '#ffbb39' } }}>Log in!</Typography>
            </Link>
          </Box>
        </MuiCard>
      </Zoom>
    </form>
  )
}

export default RegisterForm
