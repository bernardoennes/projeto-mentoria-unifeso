import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import AppRouter from './routes/AppRouter.jsx'

function ThemeAwareToastContainer() {
  const { theme } = useTheme()

  return (
    <ToastContainer
      theme={theme}
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <ThemeAwareToastContainer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
