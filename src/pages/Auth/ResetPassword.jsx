import { useState, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import { Card as MuiCard } from '@mui/material'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import Zoom from '@mui/material/Zoom'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LockResetIcon from '@mui/icons-material/LockReset'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { ReactComponent as Logo } from '~/assets/logo.svg'
import { resetPasswordAPI } from '~/apis'
import { toast } from 'react-toastify'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [tokenError, setTokenError] = useState('')

  const passwordRef = useRef(null)
  const confirmPasswordRef = useRef(null)

  const iconStyle = { color: '#636e72' }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }

    try {
      await toast.promise(
        resetPasswordAPI({
          token,
          password
        }),
        {
          pending: 'Resetting password...'
        }
      )

      toast.success('Password reset successfully!')

      navigate('/login')

    } catch (error) {
      const errorMessage = error?.response?.data?.message

      if (
        errorMessage === 'Invalid reset token!' ||
        errorMessage === 'Reset token has expired!'
      ) {
        setTokenError(errorMessage)
      }
    }
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

  const handleClickShowConfirmPassword = () => {
    if (confirmPasswordRef.current) {
      const input = confirmPasswordRef.current
      const cursorPos = input.selectionStart

      setShowConfirmPassword(prev => !prev)

      setTimeout(() => {
        input.focus()
        input.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    } else {
      setShowConfirmPassword(prev => !prev)
    }
  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault()
  }

  if (tokenError) {
    return (
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <MuiCard sx={{
          width: { xs: 320, sm: 360, md: 400 },
          maxWidth: '100%',
          marginTop: { xs: '4em', sm: '6em' },
          mx: 'auto'
        }}>
          <Box sx={{
            margin: '1em',
            display: 'flex',
            justifyContent: 'center',
            gap: 1
          }}>
            <Avatar sx={{
              bgcolor: 'error.main',
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 }
            }}>
              <ErrorOutlineIcon sx={{ fontSize: { xs: '18px', sm: '20px', md: '24px' } }} />
            </Avatar>

            <Avatar sx={{
              bgcolor: 'primary.main',
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 }
            }}>
              <Logo style={{ width: '80%', height: '80%' }} />
            </Avatar>
          </Box>

          <Box sx={{
            padding: '0 2em 2em 2em',
            textAlign: 'center'
          }}>
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                color: 'error.main'
              }}
            >
              Reset Link Invalid
            </Typography>

            <Typography>
              {tokenError}
            </Typography>

            <Typography sx={{ mt: 2 }}>
              Please request a new password reset link.
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Link
                to="/forgot-password"
                style={{ textDecoration: 'none' }}
              >
                <Typography
                  sx={{
                    color: 'primary.main',
                    '&:hover': { color: '#ffbb39' }
                  }}
                >
                  Back to Forgot Password
                </Typography>
              </Link>
            </Box>
          </Box>
        </MuiCard>
      </Zoom>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <MuiCard sx={{
          width: { xs: 320, sm: 360, md: 400 },
          maxWidth: '100%',
          marginTop: { xs: '4em', sm: '6em' },
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
            }}>
              <LockResetIcon sx={{ fontSize: { xs: '18px', sm: '20px', md: '24px' } }} />
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
            <Typography
              variant="h5"
              sx={{
                textAlign: 'center',
                mb: 2
              }}
            >
              Reset Password
            </Typography>

            <Box sx={{ marginTop: '1em' }}>
              <TextField
                fullWidth
                label="Enter New Password..."
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }
                }}
                inputRef={passwordRef}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        sx={{ minWidth: 'auto', p: 0 }}
                      >
                        {showPassword
                          ? <VisibilityOff fontSize="small" sx={iconStyle} />
                          : <Visibility fontSize="small" sx={iconStyle} />
                        }
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            <Box sx={{ marginTop: '1em' }}>
              <TextField
                fullWidth
                label="Confirm New Password..."
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }
                }}
                inputRef={confirmPasswordRef}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword}
                        sx={{ minWidth: 'auto', p: 0 }}
                      >
                        {showConfirmPassword
                          ? <VisibilityOff fontSize="small" sx={iconStyle} />
                          : <Visibility fontSize="small" sx={iconStyle} />
                        }
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Box>

          <CardActions sx={{ padding: '0 1em 1em 1em' }}>
            <Button
              className='interceptor-loading'
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Reset Password
            </Button>
          </CardActions>

          <Box sx={{
            padding: '0 1em 1em 1em',
            textAlign: 'center'
          }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography
                sx={{
                  color: 'primary.main',
                  '&:hover': { color: '#ffbb39' }
                }}
              >
                Back to Login
              </Typography>
            </Link>
          </Box>
        </MuiCard>
      </Zoom>
    </form>
  )
}

export default ResetPassword