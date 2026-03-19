// 员工类型
export interface Agent {
  id: string
  name: string
  role: 'designer' | 'accountant' | 'marketer' | 'customer_service' | 'data_analyst'
  state: 'idle' | 'working' | 'offline'
  currentTask: Task | null
  skills?: string[]
  stats?: Record<string, number>
  metadata?: Record<string, any>
}

// 任务类型
export interface Task {
  id: string
  type: 'product_photo' | 'listing_copy' | 'video_ad' | 'sales_report' | 'custom'
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  platform?: 'amazon' | 'shopify' | 'temu'
  productId?: string
  input: Record<string, any>
  output?: Record<string, any>
  progress: number
  logs: string[]
  createdAt: number
  startedAt?: number
  completedAt?: number
  dependencies?: string[]
  subtasks?: Task[]
}

// 简单的 uuid 生成
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
