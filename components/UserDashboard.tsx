'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import axios from 'axios'
import { Moon, Sun, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import toast from 'react-hot-toast'
import TaskCard from './TaskCard'

interface Task {
  id: number
  title: string
  description: string
  status: string
  product_image_url: string
  created_at: string
}

export default function UserDashboard() {
  const { user } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    try {
      const token = await user?.getToken()
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/my-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user?.id || ''
        }
      })
      setTasks(response.data)
    } catch (error) {
      toast.error('Failed to load tasks')
      console.error(error)
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
          <h1 className="text-2xl font-bold">My Tasks</h1>
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Assigned</p>
                <p className="text-3xl font-bold mt-2">{stats.assigned}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">In Progress</p>
                <p className="text-3xl font-bold mt-2">{stats.in_progress}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Submitted</p>
                <p className="text-3xl font-bold mt-2">{stats.submitted}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold mt-2">{stats.completed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <h2 className="text-2xl font-bold mb-6">Your Tasks</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} isAdmin={false} onUpdate={fetchTasks} />
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks assigned yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}
