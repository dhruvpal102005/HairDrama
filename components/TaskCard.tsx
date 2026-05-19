'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Clock, CheckCircle, AlertCircle, Play } from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string
  status: string
  product_image_url: string
  created_at: string
}

interface TaskCardProps {
  task: Task
  isAdmin: boolean
  onUpdate: () => void
}

export default function TaskCard({ task, isAdmin }: TaskCardProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      submitted: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      revision_requested: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle className="w-4 h-4" />
    if (status === 'in_progress') return <Play className="w-4 h-4" />
    if (status === 'revision_requested') return <AlertCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  return (
    <div
      onClick={() => router.push(`/tasks/${task.id}`)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="relative h-48 bg-gray-200">
        <Image
          src={task.product_image_url}
          alt={task.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg truncate">{task.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {task.description || 'No description'}
        </p>
        <p className="text-xs text-gray-500">
          Created {new Date(task.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
