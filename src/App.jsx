import { Routes, Route, Navigate } from 'react-router-dom'
import Board from '~/pages/Boards/_id'
import NotFound from '~/pages/404/NotFound'
import Auth from '~/pages/Auth/Auth'

function App() {
  return (
    <Routes>
      {/* Redirect Route */}
      <Route path='/' element={
        <Navigate to="/boards/6899621f45e7e71a86fe4002" replace={true} />
      } />

      {/* Board Detail */}
      <Route path='/boards/:boardId' element={<Board/>} />

      {/* Authentication */}
      <Route path='/login' element={<Auth/>} />
      <Route path='/register' element={<Auth/>} />

      {/* 404 not found page */}
      <Route path='*' element={<NotFound/>} />
    </Routes>
  )
}

export default App
