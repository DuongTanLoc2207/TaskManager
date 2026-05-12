import { useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import { Card as MuiCard } from '@mui/material'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import Zoom from '@mui/material/Zoom'
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { ReactComponent as Logo } from '~/assets/logo.svg'
import { forgotPasswordAPI } from '~/apis'
import { toast } from 'react-toastify'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    toast.promise(
      forgotPasswordAPI({ email }),
      {
        pending: 'Sending reset link...'
      }
    ).then(() => {
      setIsSubmitted(true)
    })
  }

  if (isSubmitted) {
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
              bgcolor: 'success.main',
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 }
            }}>
              <CheckCircleOutlineIcon sx={{ fontSize: { xs: '18px', sm: '20px', md: '24px' } }} />
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
            padding: '0 1.5em 1.5em 1.5em',
            textAlign: 'center'
          }}>
            <Typography
              variant="h5"
              sx={{ mb: 2 }}
            >
              Check your email
            </Typography>

            <Typography>
              We have sent a password reset link to:
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontWeight: 'bold',
                color: 'primary.main',
                wordBreak: 'break-word'
              }}
            >
              {email}
            </Typography>

            <Typography sx={{ mt: 3 }}>
              Please check your inbox and follow the instructions.
            </Typography>

            <Box sx={{ mt: 3 }}>
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
              <MarkEmailUnreadIcon sx={{ fontSize: { xs: '18px', sm: '20px', md: '24px' } }} />
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
              Forgot Password
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label="Enter Email..."
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.8rem', sm: '0.9rem' }
                }
              }}
            />
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
              Send Reset Link
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

export default ForgotPassword