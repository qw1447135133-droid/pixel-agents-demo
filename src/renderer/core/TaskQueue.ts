// 简单的 uuid 生成（不用 uuid 包）
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 直接导出接口
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

export interface TaskQueueEvent {
  type: 'task_queued' | 'task_started' | 'task_progress' | 'task_completed' | 'task_failed'
  task: Task
}

export class TaskQueue {
  private queue: Task[] = []
  private running: Task | null = null
  private completed: Task[] = []
  private failed: Task[] = []
  private listeners: ((event: TaskQueueEvent) => void)[] = []
  private processing = false

  enqueue(task: Omit<Task, 'id' | 'status' | 'progress' | 'logs' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: generateId(),
      status: 'pending',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    }

    this.queue.push(newTask)
    this.emit({ type: 'task_queued', task: newTask })
    this.processQueue()
    return newTask
  }

  cancel(taskId: string): boolean {
    const index = this.queue.findIndex(t => t.id === taskId)
    if (index !== -1) {
      this.queue.splice(index, 1)
      return true
    }
    return false
  }

  getStatus() {
    return {
      pending: this.queue.length,
      running: this.running,
      completed: this.completed.length,
      failed: this.failed.length
    }
  }

  getAllTasks(): Task[] {
    return [
      ...(this.running ? [this.running] : []),
      ...this.queue,
      ...this.completed,
      ...this.failed
    ]
  }

  addListener(listener: (event: TaskQueueEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.running || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0 && !this.running) {
      const task = this.queue.shift()!
      this.running = { ...task, status: 'running', startedAt: Date.now() }
      this.emit({ type: 'task_started', task: this.running })

      try {
        await this.simulateTaskExecution(this.running)
        this.running.status = 'completed'
        this.running.completedAt = Date.now()
        this.completed.push(this.running)
        this.emit({ type: 'task_completed', task: this.running })
      } catch (error) {
        this.running.status = 'failed'
        this.running.logs.push(`Error: ${(error as Error).message}`)
        this.failed.push(this.running)
        this.emit({ type: 'task_failed', task: this.running })
      } finally {
        this.running = null
      }
    }

    this.processing = false
  }

  private async simulateTaskExecution(task: Task): Promise<void> {
    const totalSteps = 10
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200))
      if (this.running?.id === task.id) {
        this.running.progress = (i / totalSteps) * 100
        this.running.logs.push(`Step ${i}/${totalSteps} completed`)
        this.emit({ type: 'task_progress', task: this.running })
      }
    }
  }

  private emit(event: TaskQueueEvent): void {
    this.listeners.forEach(listener => listener(event))
  }
}

export const taskQueue = new TaskQueue()
