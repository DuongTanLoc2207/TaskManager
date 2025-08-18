import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

// Khởi tạo giá trị State của Slice trong redux
const initialState = {
  currentUser: null
}

export const loginUserAPI = createAsyncThunk(
  'user/loginUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, data)
    return response.data
  }
)

// Khởi tạo một Slice trong Redux Store
export const userSlice = createSlice({
  name: 'user',
  initialState,
  // Reducers: nơi xử lý dữ liệu đồng bộ
  reducers: {},
  // ExtraReducers: nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      // action.payload ở đây là response.data trả về ở trên
      const user = action.payload
      state.currentUser = user
    })
  }

})

// Actions: cập nhật lại dữ liệu thông qua reducer (đồng bộ)
// export const {} = userSlice.actions

// Selectors: lấy dữ liệu trong redux store
export const selectCurrentUser = (state) => {
  return state.user.currentUser
}

export const userReducer = userSlice.reducer