export interface User {
  id: number
  clerk_id: string
  email: string
  name: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  product_image_url: string
  status: TaskStatus
  created_by: string
  assigned_to: number | null
  revision_notes?: string
  created_at: string
  updated_at: string
  started_at?: string
  submitted_at?: string
}

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'accepted'
  | 'revision_requested'

export interface GeneratedImage {
  id: number
  task_id: number
  image_type: ImageType
  angle?: ModelAngle
  theme?: string
  image_url: string
  prompt_used: string
  metadata: Record<string, any>
  is_final: boolean
  created_at: string
}

export type ImageType = 'white_bg' | 'theme' | 'creative' | 'model'

export type ModelAngle = 'front' | 'side' | 'closeup'

export interface Analytics {
  total_users: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
}

export interface GenerationJob {
  job_id: string
  status: 'processing' | 'completed' | 'failed'
  result?: {
    image_url: string
    image_id: number
  }
  error?: string
}
