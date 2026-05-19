'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { ArrowLeft, Play, Send } from 'lucide-react'
import AIStudio from '@/components/AIStudio'

interface Task {
  id: number
  title: string
  description: string
  status: string
  product_image_url: string
  created_at: string
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTask = async () => {
    try {
      const token = await user?.getToken()
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user?.id || ''
          }
        }
      )
      setTask(response.data)
    } catch (error) {
      toast.error('Failed to load task')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchTask()
  }, [user, params.id])

  const handleStartTask = async () => {
    try {
      const token = await user?.getToken()
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${params.id}/start`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user?.id || ''
          }
        }
      )
      toast.success('Task started!')
      fetchTask()
    } catch (error) {
      toast.error('Failed to start task')
    }
  }

  const handleSubmitTask = async () => {
    try {
      const token = await user?.getToken()
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${params.id}/submit`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user?.id || ''
          }
        }
      )
      toast.success('Task submitted successfully!')
      fetchTask()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit task')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Task not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Task Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {task.status.replace('_', ' ')}
            </span>
          </div>

          {/* Product Image */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Original Product Image</h3>
            <div className="relative h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <Image
                src={task.product_image_url}
                alt={task.title}
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {task.status === 'assigned' && (
            <button
              onClick={handleStartTask}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="w-5 h-5" />
              Start Working
            </button>
          )}
        </div>

        {/* AI Studio */}
        {(task.status === 'in_progress' || task.status === 'submitted') && (
          <>
            <AIStudio taskId={task.id} productImageUrl={task.product_image_url} />
            
            {task.status === 'in_progress' && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmitTask}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send className="w-5 h-5" />
                  Submit Task
                </button>
              </div>
            )}
          </>
        )}

        {task.status === 'submitted' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              Task submitted! Waiting for admin review.
            </p>
          </div>
        )}

        {task.status === 'accepted' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
            <p className="text-green-800 dark:text-green-200">
              ✅ Task accepted! Great work!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
