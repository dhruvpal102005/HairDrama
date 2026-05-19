'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import axios from 'axios'
import { Moon, Sun, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import TaskCard from '@/components/TaskCard'

interface Task {
  id: number
  title: string
  description: string
  status: string
  product_image_url: string
  created_at: string
}

// Mock data for demo
const MOCK_USER_TASKS: Task[] = [
  {
    id: 1,
    title: 'Pearl Necklace Photography',
    description: 'Generate 8 professional images with different backgrounds',
    status: 'assigned',
    product_image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Diamond Ring Product Shots',
    description: 'Create lifestyle and studio shots',
    status: 'in_progress',
    product_image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
    created_at: new Date().toISOString()
  }
]

export default function UserDashboard() {
  const { user } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  const fetchTasks = async () => {
    try {
      if (!user) return
      
      // Get session token from Clerk
      let token = ''
      try {
        // Try to get session token
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
            email: user.primaryEmailAddress?.emailAddress || `${user.id}@user.clerk`,
            name: user.fullName || user.firstName || 'User',
            role: 'user'
          },
          { headers }
        )
      } catch (e) {
        console.log('Sync error:', e)
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/my-tasks`, {
        headers
      })
      setTasks(response.data)
      setDemoMode(false)
    } catch (error: any) {
      console.log('Backend error:', error.response?.data || error.message)
      console.log('Using demo mode')
      setTasks(MOCK_USER_TASKS)
      setDemoMode(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  const getStatusStats = () => {
    return {
      assigned: tasks.filter(t => t.status === 'assigned').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      submitted: tasks.filter(t => t.status === 'submitted').length,
      completed: tasks.filter(t => t.status === 'accepted').length
    }
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
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
                <strong>Demo Mode:</strong> Backend not connected. This is sample data showing what your tasks will look like.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">View and complete your assigned photography tasks</p>
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.assigned}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Tasks waiting to start</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.in_progress}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Currently working on</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Submitted</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.submitted}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Awaiting review</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Successfully finished</p>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Click on a task to start generating AI images</p>
        </div>

        {tasks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} isAdmin={false} onUpdate={fetchTasks} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks assigned yet</h3>
              <p className="text-gray-500">
                When an admin assigns you a task, it will appear here. You'll also receive an email notification.
              </p>
            </div>
          </div>
        )}

        {/* How It Works (only in demo mode) */}
        {demoMode && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">📸 How TaskHub Works</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex gap-3">
                <span className="font-bold">1.</span>
                <p><strong>Get Assigned:</strong> Admin assigns you a product photography task</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold">2.</span>
                <p><strong>Open AI Studio:</strong> Click on the task to open the AI generation interface</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold">3.</span>
                <p><strong>Generate 8 Images:</strong> Create professional photos with different backgrounds:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>1 white background</li>
                    <li>2 themed backgrounds (marble, velvet)</li>
                    <li>2 creative scenes</li>
                    <li>3 model wearing shots (front, side, closeup)</li>
                  </ul>
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold">4.</span>
                <p><strong>Submit:</strong> Once all 8 images are generated, submit for admin review</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold">5.</span>
                <p><strong>Get Feedback:</strong> Admin reviews and either accepts or requests revisions</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
