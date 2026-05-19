'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, Upload } from 'lucide-react'

interface CreateTaskModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateTaskModal({ onClose, onSuccess }: CreateTaskModalProps) {
  const { user } = useUser()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !imageUrl) {
      toast.error('Title and product image are required')
      return
    }

    if (!user) return

    setLoading(true)
    try {
      const token = await (user as any).getToken?.() || ''
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`,
        {
          title,
          description,
          product_image_url: imageUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user.id || ''
          }
        }
      )
      
      toast.success('Task created successfully!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to create task')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              placeholder="e.g., Pearl Necklace Photography"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              rows={3}
              placeholder="Describe the task requirements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Product Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              placeholder="https://example.com/product.jpg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              <Upload className="w-3 h-3 inline mr-1" />
              Upload to Supabase Storage or use external URL
            </p>
          </div>

          {imageUrl && (
            <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
