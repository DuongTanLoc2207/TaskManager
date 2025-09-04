import { useState } from 'react'
import { useColorScheme } from '@mui/material/styles'
import MDEditor from '@uiw/react-md-editor'
import rehypeSanitize from 'rehype-sanitize'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import EditNoteIcon from '@mui/icons-material/EditNote'

function CardDescriptionMdEditor({ cardDescriptionProp, handleUpdateCardDescription }) {
  // Lấy giá trị 'dark', 'light' hoặc 'system' mode từ MUI để support phần Markdown bên dưới: data-color-mode={mode}
  // https://www.npmjs.com/package/@uiw/react-md-editor#support-dark-modenight-mode
  const { mode } = useColorScheme()

  // State xử lý chế độ Edit và chế độ View
  const [markdownEditMode, setMarkdownEditMode] = useState(false)
  // State xử lý giá trị markdown khi chỉnh sửa
  const [cardDescription, setCardDescription] = useState(cardDescriptionProp)

  const updateCardDescription = () => {
    setMarkdownEditMode(false)
    handleUpdateCardDescription(cardDescription)
  }

  return (
    <Box sx={{ mt: { xs: -2, sm: -4 } }}>
      {markdownEditMode
        ? <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box data-color-mode={mode}>
            <MDEditor
              value={cardDescription}
              onChange={setCardDescription}
              previewOptions={{ rehypePlugins: [[rehypeSanitize]] }} // https://www.npmjs.com/package/@uiw/react-md-editor#security
              height={window.innerWidth < 600 ? 300 : 400}
              preview="edit" // Có 3 giá trị để set tùy nhu cầu ['edit', 'live', 'preview']
              // hideToolbar={true}
            />
          </Box>
          <Button
            sx={{ alignSelf: 'flex-end', fontSize: { xs: '12px', sm: '14px' } }}
            onClick={updateCardDescription}
            className="interceptor-loading"
            type="button"
            variant="contained"
            size="small"
            color="info">
            Save
          </Button>
        </Box>
        : <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            sx={{ alignSelf: 'flex-end', fontSize: { xs: '12px', sm: '14px' } }}
            onClick={() => setMarkdownEditMode(true)}
            type="button"
            variant="contained"
            color="info"
            size="small"
            startIcon={<EditNoteIcon />}>
            Edit
          </Button>
          <Box data-color-mode={mode}>
            <MDEditor.Markdown
              source={cardDescription}
              style={{
                whiteSpace: 'pre-wrap',
                padding: cardDescription ? '10px' : '0px',
                border:  cardDescription ? '0.5px solid rgba(0, 0, 0, 0.2)' : 'none',
                borderRadius: '8px'
              }}
            />
          </Box>
        </Box>
      }
    </Box>
  )
}

export default CardDescriptionMdEditor
