'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import axios from 'axios'
import { Plus, Users, CheckCircle, Clock, Moon, Sun } from 'lucide-react'
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

interface Analytics {
  total_users: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
}

export default function AdminDashboard() {
  const { user } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchData = async () => {
    try {
      if (!user) return
      const token = await (user as any).getToken?.() || ''
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': user.id || ''
      }

      const [tasksRes, analyticsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, { headers })
      ])

      setTasks(tasksRes.data)
      setAnalytics(analyticsRes.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold mt-2">{analytics?.total_users || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold mt-2">{analytics?.total_tasks || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold mt-2">{analytics?.completed_tasks || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold mt-2">{analytics?.pending_tasks || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Create Task Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">All Tasks</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        </div>

        {/* Tasks Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} isAdmin={true} onUpdate={fetchData} />
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks yet. Create your first task!</p>
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
