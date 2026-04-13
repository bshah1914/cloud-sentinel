import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function AppLayout() {
  const { pathname } = useLocation()
  const hideNavFooter = pathname === '/login' || pathname === '/dashboard'

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavFooter && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      {!hideNavFooter && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
