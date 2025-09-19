import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'

function ToggleFocusInput({ id, value, onChangedValue, inputFontSize = '16px', inputFontWeight, ...props }) {
  const [inputValue, setInputValue] = useState(value)

  // Đồng bộ inputValue với prop value khi value thay đổi
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  const triggerBlur = () => {
    const trimmedValue = inputValue.trim()
    setInputValue(trimmedValue)

    if (!inputValue || inputValue.trim() === value) {
      setInputValue(value)
      return
    }

    onChangedValue(trimmedValue)
  }

  return (
    <TextField
      id={id}
      fullWidth
      variant='outlined'
      size="small"
      value={inputValue}
      onChange={(event) => { setInputValue(event.target.value) }}
      onBlur={triggerBlur}
      {...props}
      sx={{
        '& label': {},
        '& input': { fontSize: inputFontSize, fontWeight: inputFontWeight || 'bold' },
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'transparent',
          '& fieldset': { borderColor: 'transparent' }
        },
        '& .MuiOutlinedInput-root:hover': {
          borderColor: 'transparent',
          '& fieldset': { borderColor: 'transparent' }
        },
        '& .MuiOutlinedInput-root.Mui-focused': {
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#33485D' : 'white',
          '& fieldset': { borderColor: 'primary.main' }
        },
        '& .MuiOutlinedInput-input': {
          px: '6px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }
      }}
    />
  )
}

export default ToggleFocusInput
