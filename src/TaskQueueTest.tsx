import { useState, useEffect } from 'react'

// 内联类型定义，避免导入问题
interface Task {
  id: string
  type: 'product_photo' | 'listing_copy' | 'video_ad' | 'sales_report' | 'custom'
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  platform?: 'amazon' | 'shopify' | 'temu'
  input: Record<string, any>
  output?: Record<string, any>
  progress: number
  logs: string[]
  createdAt: number
  startedAt?: number
  completedAt?: number
}

interface TaskQueueEvent {
  type: 'task_queued' | 'task_started' | 'task_progress' | 'task_completed' | 'task_failed'
  task: Task
}

// 简单的 uuid 生成
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 内联TaskQueue实现
class SimpleTaskQueue {
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

// 导出单例
const taskQueue = new SimpleTaskQueue()

function TaskQueueTest() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<string[]>([])

  // 记录日志
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // 监听 TaskQueue 事件
  useEffect(() => {
    addLog('TaskQueue 测试页面加载中...')
    try {
      const unsubscribe = taskQueue.addListener((event: TaskQueueEvent) => {
        addLog(`收到事件: ${event.type} - 任务: ${event.task.type}`)
        setTasks(prev => {
          const index = prev.findIndex(t => t.id === event.task.id)
          if (index === -1) {
            return [...prev, event.task]
          }
          return [
            ...prev.slice(0, index),
            { ...prev[index], ...event.task },
            ...prev.slice(index + 1)
          ]
        })
      })
      addLog('TaskQueue 监听器注册成功！')
      return unsubscribe
    } catch (error) {
      addLog(`TaskQueue 初始化失败: ${error}`)
      return () => {}
    }
  }, [])

  const handleCreateTask = () => {
    addLog('正在创建测试任务...')
    try {
      taskQueue.enqueue({
        type: 'product_photo',
        priority: 'medium',
        platform: 'amazon',
        input: { productName: '无线蓝牙耳机', style: '现代简约' }
      })
      addLog('测试任务已加入队列！')
    } catch (error) {
      addLog(`创建任务失败: ${error}`)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-yellow'
      case 'running': return 'badge-blue'
      case 'completed': return 'badge-green'
      default: return 'badge-red'
    }
  }

  const getStatusName = (status: string) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'running': return '进行中'
      case 'completed': return '已完成'
      default: return status
    }
  }

  return (
    <div style={{ padding: 20, backgroundColor: '#111827', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 16, fontSize: 24 }}>TaskQueue 测试页面</h1>
      
      <button
        onClick={handleCreateTask}
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          backgroundColor: '#2563eb',
          color: 'white',
          marginBottom: 16
        }}
      >
        + 创建测试任务
      </button>

      <h2 style={{ marginBottom: 12, fontSize: 18 }}>任务列表</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {tasks.length === 0 ? (
          <div style={{ color: '#6b7280' }}>暂无任务，点击上方按钮创建</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} style={{
              padding: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
              border: '1px solid #4b5563'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>
                  {task.type === 'product_photo' ? '产品图生成' : task.type}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  ...(task.status === 'pending' ? { backgroundColor: '#713f12', color: '#fde047' } :
                     task.status === 'running' ? { backgroundColor: '#1e3a8a', color: '#93c5fd' } :
                     task.status === 'completed' ? { backgroundColor: '#14532d', color: '#86efac' } :
                     { backgroundColor: '#7f1d1d', color: '#fca5a5' })
                }}>
                  {task.status === 'pending' ? '等待中' :
                   task.status === 'running' ? '进行中' :
                   task.status === 'completed' ? '已完成' : task.status}
                </span>
              </div>
              
              {task.status === 'running' && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{
                    height: 8,
                    backgroundColor: '#374151',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      width: `${task.progress}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                    {Math.round(task.progress)}%
                  </div>
                </div>
              )}
              
              {task.platform && (
                <div style={{ color: '#9ca3af', fontSize: 12 }}>
                  平台: {task.platform}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <h2 style={{ marginBottom: 12, fontSize: 18 }}>日志</h2>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: 6,
        padding: 12,
        maxHeight: 300,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: 12
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>暂无日志</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TaskQueueTest
