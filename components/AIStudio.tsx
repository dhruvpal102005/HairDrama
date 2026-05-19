'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { Sparkles, Loader, Trash2, Download, RefreshCw, CheckCircle } from 'lucide-react'

interface GeneratedImage {
  id: number
  image_type: string
  angle?: string
  theme?: string
  image_url: string
  is_final: boolean
  created_at: string
}

interface AIStudioProps {
  taskId: number
  productImageUrl: string
}

const IMAGE_REQUIREMENTS = [
  { type: 'white_bg', label: 'White Background', count: 1, angle: null },
  { type: 'theme', label: 'Marble Theme', count: 1, theme: 'marble' },
  { type: 'theme', label: 'Velvet Theme', count: 1, theme: 'velvet' },
  { type: 'creative', label: 'Creative Scene 1', count: 1, theme: null },
  { type: 'creative', label: 'Creative Scene 2', count: 1, theme: null },
  { type: 'model', label: 'Model - Front View', count: 1, angle: 'front' },
  { type: 'model', label: 'Model - Side View', count: 1, angle: 'side' },
  { type: 'model', label: 'Model - Close-up', count: 1, angle: 'closeup' },
]

export default function AIStudio({ taskId, productImageUrl }: AIStudioProps) {
  const { user } = useUser()
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [polling, setPolling] = useState<Record<string, string>>({}) // jobId by key

  const fetchImages = async () => {
    try {
      const token = await user?.getToken()
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/generations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user?.id || ''
          }
        }
      )
      setImages(response.data)
    } catch (error) {
      console.error('Failed to fetch images:', error)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [taskId, user])

  const pollJobStatus = async (jobId: string, key: string) => {
    const token = await user?.getToken()
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}/status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-User-Id': user?.id || ''
            }
          }
        )

        if (response.data.status === 'completed') {
          clearInterval(interval)
          setGenerating(prev => ({ ...prev, [key]: false }))
          setPolling(prev => {
            const newPolling = { ...prev }
            delete newPolling[key]
            return newPolling
          })
          toast.success('Image generated successfully!')
          fetchImages()
        } else if (response.data.status === 'failed') {
          clearInterval(interval)
          setGenerating(prev => ({ ...prev, [key]: false }))
          toast.error('Generation failed. Please try again.')
        }
      } catch (error) {
        clearInterval(interval)
        setGenerating(prev => ({ ...prev, [key]: false }))
        toast.error('Failed to check generation status')
      }
    }, 3000) // Poll every 3 seconds

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
      setGenerating(prev => ({ ...prev, [key]: false }))
    }, 300000)
  }

  const handleGenerate = async (requirement: typeof IMAGE_REQUIREMENTS[0], index: number) => {
    const key = `${requirement.type}-${requirement.angle || requirement.theme || index}`
    
    setGenerating(prev => ({ ...prev, [key]: true }))
    
    try {
      const token = await user?.getToken()
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/generate`,
        {
          image_type: requirement.type,
          angle: requirement.angle,
          theme: requirement.theme
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user?.id || ''
          }
        }
      )

      const jobId = response.data.job_id
      setPolling(prev => ({ ...prev, [key]: jobId }))
      toast.success('Generation started! This may take 1-2 minutes...')
      
      // Start polling
      pollJobStatus(jobId, key)
      
    } catch (error: any) {
      setGenerating(prev => ({ ...prev, [key]: false }))
      toast.error(error.response?.data?.error || 'Failed to start generation')
    }
  }

  const handleDelete = async (imageId: number) => {
    try {
      const token = await user?.getToken()
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/generations/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user?.id || ''
          }
        }
      )
      toast.success('Image deleted')
      fetchImages()
    } catch (error) {
      toast.error('Failed to delete image')
    }
  }

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  const getImageForRequirement = (requirement: typeof IMAGE_REQUIREMENTS[0], index: number) => {
    return images.find(img => {
      if (requirement.angle) {
        return img.image_type === requirement.type && img.angle === requirement.angle
      }
      if (requirement.theme) {
        return img.image_type === requirement.type && img.theme === requirement.theme
      }
      // For creative images without specific theme
      return img.image_type === requirement.type && !img.theme
    })
  }

  const completedCount = images.length
  const totalRequired = 8

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Studio
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Generate 8 professional product images with consistent product appearance
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{completedCount}/8</div>
          <div className="text-sm text-gray-500">Images Generated</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalRequired) * 100}%` }}
          />
        </div>
      </div>

      {/* Generation Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {IMAGE_REQUIREMENTS.map((requirement, index) => {
          const key = `${requirement.type}-${requirement.angle || requirement.theme || index}`
          const existingImage = getImageForRequirement(requirement, index)
          const isGenerating = generating[key]

          return (
            <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{requirement.label}</h3>
                {existingImage && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>

              {existingImage ? (
                <div className="space-y-3">
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={existingImage.image_url}
                      alt={requirement.label}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerate(requirement, index)}
                      disabled={isGenerating}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={() => handleDownload(existingImage.image_url, `${requirement.label}.png`)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(existingImage.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    {isGenerating ? (
                      <div className="text-center">
                        <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Generating...</p>
                      </div>
                    ) : (
                      <p className="text-gray-400">Not generated yet</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleGenerate(requirement, index)}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Important Notes:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• The product must look EXACTLY the same across all 8 images</li>
          <li>• Only the background, setting, or model should change</li>
          <li>• You can regenerate any image until you're satisfied with the quality</li>
          <li>• All 8 images must be generated before you can submit the task</li>
          <li>• Each generation takes 1-2 minutes - please be patient</li>
        </ul>
      </div>
    </div>
  )
}
