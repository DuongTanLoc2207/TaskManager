import { experimental_extendTheme as extendTheme } from '@mui/material/styles'
import { deepOrange, orange, teal, cyan } from '@mui/material/colors'

// Create a theme instance.
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: teal[500],
          secondary: deepOrange[500]
        }
      }
    },
    dark: {
      palette: {
        primary: {
          main: cyan[500],
          secondary: orange[500]
        }
      }
    }
  }
  // ...other properties
})

export default theme