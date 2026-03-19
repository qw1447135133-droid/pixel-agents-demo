// 员工类型
export interface Agent {
  id: string
  name: string
  role: 'designer' | 'accountant' | 'marketer' | 'customer_service' | 'data_analyst'
  
  // 状态
  state: 'idle' | 'working' | 'offline'
  currentTask: Task | null
  
  // 扩展预留
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
  
  // 电商相关
  platform?: 'amazon' | 'shopify' | 'temu'
  productId?: string
  
  // 输入/输出
  input: Record<string, any>
  output?: Record<string, any>
  
  // 进度
  progress: number
  logs: string[]
  
  // 时间
  createdAt: number
  startedAt?: number
  completedAt?: number
  
  // 扩展预留
  dependencies?: string[]
  subtasks?: Task[]
}

// 工作流步骤
export interface WorkflowStep {
  id: string
  taskType: string
  agentRole: string
  inputFrom?: string
}

// 工作流
export interface Workflow {
  id: string
  name: string
  steps: WorkflowStep[]
}

// API 密钥信息
export interface ApiKeyInfo {
  name: string
  provider: string
  createdAt: number
}

// 浏览器标签页
export interface BrowserTab {
  id: string
  url: string
  title: string
  department?: string
}

// 统一错误基类
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTH_ERROR', message, 401)
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied') {
    super('PERMISSION_DENIED', message, 403)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super('RATE_LIMIT', message, 429)
  }
}

export class TaskTimeoutError extends AppError {
  constructor(taskId: string) {
    super('TASK_TIMEOUT', `Task ${taskId} timed out`, 408, { taskId })
  }
}
