'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import axios from 'axios'
import { Plus, Users, CheckCircle, Clock, Moon, Sun, AlertCircle, UserPlus } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import toast from 'react-hot-toast'
import CreateTaskModal from '@/components/CreateTaskModal'
import TaskCard from '@/components/TaskCard'

interface Task {
  id: number
  title: string
  description: string
  status: string
  product_image_url: string
  assigned_to: number | null
  created_at: string
}

interface User {
  id: number
  clerk_id: string
  email: string
  name: string
  role: string
}

interface Analytics {
  total_users: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
}

// Mock data for demo
const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: 'Pearl Necklace Photography',
    description: 'Generate 8 professional images of pearl necklace with different backgrounds',
    status: 'pending',
    product_image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    assigned_to: null,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Diamond Ring Product Shots',
    description: 'Create lifestyle and studio shots for diamond engagement ring',
    status: 'in_progress',
    product_image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
    assigned_to: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Gold Watch Photography',
    description: 'Professional product photography with model wearing shots',
    status: 'submitted',
    product_image_url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
    assigned_to: 2,
    created_at: new Date().toISOString()
  }
]

const MOCK_ANALYTICS: Analytics = {
  total_users: 5,
  total_tasks: 12,
  completed_tasks: 7,
  pending_tasks: 5
}

export default function AdminDashboard() {
  const { user } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  const fetchData = async () => {
    try {
      if (!user) return
      
      // Get session token from Clerk
      let token = ''
      try {
        const sessionToken = await (user as any).getToken?.()
        token = sessionToken || ''
      } catch (e) {
        console.log('Could not get session token:', e)
      }
      
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'X-User-Id': user.id
      }

      // Sync user to database first
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/sync`,
          {
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || `${user.id}@admin.clerk`,
            name: user.fullName || user.firstName || 'Admin',
            role: 'admin'
          },
          { headers }
        )
      } catch (e) {
        console.log('Sync error:', e)
      }

      const [tasksRes, analyticsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, { headers })
      ])

      setTasks(tasksRes.data)
      setAnalytics(analyticsRes.data)
      
      // Fetch users for assignment
      try {
        const usersRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { headers })
        setUsers(usersRes.data)
      } catch (e) {
        console.log('Could not fetch users:', e)
      }
      
      setDemoMode(false)
    } catch (error: any) {
      console.log('Backend error:', error.response?.data || error.message)
      console.log('Using demo mode')
      // Use mock data if backend is not available
      setTasks(MOCK_TASKS)
      setAnalytics(MOCK_ANALYTICS)
      setDemoMode(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTask = async (userId: number) => {
    if (!selectedTask || !user) return
    
    try {
      const token = await (user as any).getToken?.() || ''
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'X-User-Id': user.id
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${selectedTask.id}/assign`,
        { user_id: userId },
        { headers }
      )
      
      toast.success('Task assigned successfully!')
      setShowAssignModal(false)
      setSelectedTask(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign task')
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="container mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> Backend not connected. This is sample data. 
                <a href="#setup" className="underline ml-2 font-medium">Setup backend to see real data</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage tasks and monitor platform activity</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.total_users || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.total_tasks || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.completed_tasks || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.pending_tasks || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Create Task Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
            <p className="text-sm text-gray-500 mt-1">Create and manage product photography tasks</p>
          </div>
          <button
            onClick={() => {
              if (demoMode) {
                toast.error('Demo mode: Connect backend to create real tasks')
              } else {
                setShowCreateModal(true)
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        </div>

        {/* Tasks Grid */}
        {tasks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="relative">
                <TaskCard task={task} isAdmin={true} onUpdate={fetchData} />
                {task.status === 'pending' && !demoMode && (
                  <button
                    onClick={() => {
                      setSelectedTask(task)
                      setShowAssignModal(true)
                    }}
                    className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-md flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first task to start generating AI-powered product photography
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                Create Your First Task
              </button>
            </div>
          </div>
        )}

        {/* Setup Instructions (only in demo mode) */}
        {demoMode && (
          <div id="setup" className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">🚀 Setup Backend to Enable Full Functionality</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <p><strong>What you're seeing:</strong> This is demo data. To create real tasks and use AI generation, you need to:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Set up <strong>Supabase</strong> database (run migrations from <code className="bg-blue-100 px-2 py-1 rounded">/migrations</code> folder)</li>
                <li>Start <strong>Flask backend</strong> (<code className="bg-blue-100 px-2 py-1 rounded">cd backend && python app.py</code>)</li>
                <li>Start <strong>Redis</strong> for background jobs (<code className="bg-blue-100 px-2 py-1 rounded">redis-server</code>)</li>
                <li>Start <strong>Worker</strong> for AI generation (<code className="bg-blue-100 px-2 py-1 rounded">cd backend && python worker.py</code>)</li>
              </ol>
              <p className="pt-2">
                📖 <strong>Full instructions:</strong> See <code className="bg-blue-100 px-2 py-1 rounded">SETUP_GUIDE.md</code> in the project root
              </p>
            </div>
          </div>
        )}
      </main>

      {showCreateModal && !demoMode && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchData()
          }}
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Assign Task: {selectedTask.title}
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.length > 0 ? (
                users.filter(u => u.role === 'user').map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAssignTask(u.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No users available to assign.</p>
                  <p className="text-sm mt-2">Users need to sign in first to appear here.</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedTask(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
