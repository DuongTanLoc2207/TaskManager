import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES = {
  '/boards': 'Boards - Joji',
  '/login': 'Login - Joji',
  '/register': 'Register - Joji',
  '/settings/account': 'Account Settings - Joji',
  '/settings/security': 'Security Settings - Joji',
  '/account/verification': 'Account Verification - Joji'
}

export default function usePageTitle() {
  const location = useLocation()

  useEffect(() => {
    const title = TITLES[location.pathname] || 'Joji'
    document.title = title
  }, [location])
}
