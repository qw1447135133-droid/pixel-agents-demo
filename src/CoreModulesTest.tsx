import { useState, useEffect } from 'react'
import { logger } from './core/Logger'
import { withRetry, withTimeout } from './core/utils'

// 内联Task类型定义，避免导入问题
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

// 创建单例
const taskQueue = new SimpleTaskQueue()

function CoreModulesTest() {
  const [testLog, setTestLog] = useState<string[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestLog(prev => [...prev, `[${timestamp}] ${message}`])
    logger.info(message)
  }

  useEffect(() => {
    addLog('开始测试...')
    try {
      const unsubscribe = taskQueue.addListener((event: TaskQueueEvent) => {
        addLog(`TaskQueue 事件: ${event.type} - 任务: ${event.task.type}`)
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
      logger.error('TaskQueue 初始化失败', error as Error)
      return () => {}
    }
  }, [])

  const testTaskQueue = () => {
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
      logger.error('创建任务失败', error as Error)
    }
  }

  const testLogger = () => {
    addLog('开始测试 Logger...')
    logger.debug('这是一条 debug 日志')
    logger.info('这是一条 info 日志')
    logger.warn('这是一条 warn 日志')
    logger.error('这是一条 error 日志', new Error('测试错误'))
    logger.performance('测试操作', 123)
    addLog('Logger 测试完成！查看浏览器控制台输出')
  }

  const testWithRetry = async () => {
    addLog('开始测试 withRetry...')
    let attempt = 0
    try {
      const result = await withRetry(async () => {
        attempt++
        addLog(`Retry 尝试 ${attempt}...`)
        if (attempt < 3) {
          throw new Error('故意失败，测试重试')
        }
        return '重试成功！'
      }, { maxAttempts: 3, delay: 500 })
      addLog(`withRetry 测试成功: ${result}`)
    } catch (error) {
      addLog(`withRetry 测试失败: ${error}`)
    }
  }

  const testWithTimeout = async () => {
    addLog('开始测试 withTimeout...')
    try {
      await withTimeout(
        new Promise(resolve => setTimeout(resolve, 5000)),
        1000,
        new Error('超时测试错误')
      )
      addLog('withTimeout 测试应该超时，但没有！')
    } catch (error) {
      addLog(`withTimeout 测试成功: ${error}`)
    }
  }

  const clearLog = () => {
    setTestLog([])
  }

  return (
    <div style={{ padding: 20, backgroundColor: '#111827', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 16, fontSize: 24 }}>核心模块测试页面</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={testTaskQueue}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            backgroundColor: '#2563eb',
            color: 'white'
          }}
        >
          测试 TaskQueue
        </button>
        <button
          onClick={testLogger}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            backgroundColor: '#16a34a',
            color: 'white'
          }}
        >
          测试 Logger
        </button>
        <button
          onClick={testWithRetry}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            backgroundColor: '#f59e0b',
            color: '#111827'
          }}
        >
          测试 withRetry
        </button>
        <button
          onClick={testWithTimeout}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            backgroundColor: '#ef4444',
            color: 'white'
          }}
        >
          测试 withTimeout
        </button>
        <button
          onClick={clearLog}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            backgroundColor: '#4b5563',
            color: 'white'
          }}
        >
          清空日志
        </button>
      </div>

      <h2 style={{ marginBottom: 12, fontSize: 18 }}>任务列表</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {tasks.length === 0 ? (
          <div style={{ color: '#6b7280' }}>暂无任务，点击上方按钮测试</div>
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

      <h2 style={{ marginBottom: 12, fontSize: 18 }}>测试日志</h2>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: 6,
        padding: 12,
        maxHeight: 400,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: 12
      }}>
        {testLog.length === 0 ? (
          <div style={{ color: '#6b7280' }}>暂无日志，点击上方按钮开始测试</div>
        ) : (
          testLog.map((log, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CoreModulesTest
