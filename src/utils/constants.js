let apiRoot = ''
console.log('import.meta.env: ', import.meta.env)
console.log('process.env: ', process.env)
if (process.env.BUILD_MODE === 'dev') {
  apiRoot = 'http://localhost:8088'
}
if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://joji-api-3pgt.onrender.com'
}
console.log('🚀 ~ apiRoot:', apiRoot)
export const API_ROOT = apiRoot

// export const API_ROOT = 'http://localhost:8088'
// export const API_ROOT = 'https://joji-api-3pgt.onrender.com'

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12

export const CARD_MEMBER_ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}