import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Agent, Task, generateId } from './types'
import { taskQueue, TaskQueueEvent } from './TaskQueue'

interface AppContextType {
  // 员工
  agents: Agent[]
  addAgent: (agent: Omit<Agent, 'id' | 'state' | 'currentTask'>) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  
  // 任务
  tasks: Task[]
  createTask: (task: Omit<Task, 'id' | 'status' | 'progress' | 'logs' | 'createdAt'>) => Task
  
  // 选中状态
  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  
  // UI 状态
  activePanel: 'tasks' | 'agents' | null
  setActivePanel: (panel: 'tasks' | 'agents' | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [activePanel, setActivePanel] = useState<'tasks' | 'agents' | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([
    { id: generateId(), name: '小明', role: 'designer', state: 'idle', currentTask: null },
    { id: generateId(), name: '小红', role: 'marketer', state: 'idle', currentTask: null }
  ])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // 监听 TaskQueue 事件
  useEffect(() => {
    try {
      const unsubscribe = taskQueue.addListener((event: TaskQueueEvent) => {
        setTasks(prev => updateTaskInList(prev, event.task))
      })
      return unsubscribe
    } catch (error) {
      console.error('AppContext: TaskQueue 监听失败', error)
      return () => {}
    }
  }, [])

  const addAgent = (agent: Omit<Agent, 'id' | 'state' | 'currentTask'>) => {
    setAgents(prev => [...prev, { ...agent, id: generateId(), state: 'idle', currentTask: null }])
  }

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => agent.id === id ? { ...agent, ...updates } : agent))
  }

  const createTask = (task: Omit<Task, 'id' | 'status' | 'progress' | 'logs' | 'createdAt'>): Task => {
    try {
      return taskQueue.enqueue(task)
    } catch (error) {
      console.error('AppContext: 创建任务失败', error)
      // 降级方案
      const fallbackTask: Task = {
        ...task,
        id: generateId(),
        status: 'pending',
        progress: 0,
        logs: [],
        createdAt: Date.now()
      }
      setTasks(prev => [...prev, fallbackTask])
      return fallbackTask
    }
  }

  // 辅助函数：更新任务列表
  function updateTaskInList(tasks: Task[], updatedTask: Task): Task[] {
    try {
      const index = tasks.findIndex(t => t.id === updatedTask.id)
      if (index === -1) {
        return [...tasks, updatedTask]
      }
      return [
        ...tasks.slice(0, index),
        { ...tasks[index], ...updatedTask },
        ...tasks.slice(index + 1)
      ]
    } catch (error) {
      console.error('AppContext: 更新任务列表失败', error)
      return tasks
    }
  }

  return (
    <AppContext.Provider value={{
      agents,
      addAgent,
      updateAgent,
      tasks,
      createTask,
      selectedAgentId,
      setSelectedAgentId,
      selectedTaskId,
      setSelectedTaskId,
      activePanel,
      setActivePanel
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
