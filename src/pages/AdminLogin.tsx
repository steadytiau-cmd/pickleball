import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()

  useEffect(() => {
    // Store a basic admin session for compatibility
    localStorage.setItem('admin_user', JSON.stringify({
      id: 'admin',
      username: 'admin',
      role: 'admin',
      loginTime: new Date().toISOString()
    }))

    // Automatically redirect to admin dashboard
    navigate('/admin/dashboard')
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo and Loading */}
        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-full shadow-lg">
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员访问</h1>
        <p className="text-gray-600 mb-4">正在进入管理系统...</p>
        
        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
        
        {/* Back to Scoreboard */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            ← 返回计分板
          </button>
        </div>
      </div>
    </div>
  )
}