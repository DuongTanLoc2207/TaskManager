import { useState, useEffect } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import { verifyUserAPI } from '~/apis'

function AccountVerification() {
  // Lấy giá trị email từ token từ URL
  let [searchParams] = useSearchParams()
  const { email, token } = Object.fromEntries([...searchParams])

  // Tạo biến state để biết đã verify tài khoản hay chưa
  const [verified, setVerified] = useState(false)

  // Gọi API để verify tài khoản
  useEffect(() => {
    if (email && token) {
      verifyUserAPI({ email, token }).then(() => setVerified(true))
    }
  }, [email, token])

  // Nếu URL có vấn đề, không tồn tại email hoặc token
  if (!email || !token) {
    return <Navigate to="/404" />
  }

  // Nếu chưa verify xong thì hiển thị loading
  if (!verified) {
    return <PageLoadingSpinner caption="Verifying your account..." />
  }

  return <Navigate to={`/login?verifiedEmail=${email}`} />
}

export default AccountVerification