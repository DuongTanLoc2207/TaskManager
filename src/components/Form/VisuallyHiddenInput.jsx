import { styled } from '@mui/material/styles'

/**
 * Xử lý custom đẹp input file ở đây:
 * Lưu ý thành phần bọc cái VisuallyHiddenInput này phải có chứa component="label" như docs hướng dẫn:
 * https://mui.com/material-ui/react-button/#file-upload
 * ...
 * Ngoài ra note thêm lib này từ docs của MUI nó recommend nếu cần dùng:
 * https://github.com/viclafouch/mui-file-input
 */
const HiddenInputStyles = styled('input')({
  display: 'none'
})

function VisuallyHiddenInput(props) {
  return <HiddenInputStyles {...props} />
}

export default VisuallyHiddenInput
