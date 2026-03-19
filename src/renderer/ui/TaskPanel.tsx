import { useApp } from '../store/AppContext'

export function TaskPanel() {
  const { tasks, createTask, selectedTaskId, setSelectedTaskId } = useApp()

  const handleCreateTestTask = () => {
    createTask({
      type: 'product_photo',
      priority: 'medium',
      platform: 'amazon',
      input: {
        productName: '无线蓝牙耳机',
        style: '现代简约'
      }
    })
  }

  const getTaskTypeName = (type: string) => {
    switch (type) {
      case 'product_photo': return '产品图生成'
      case 'listing_copy': return '产品文案'
      case 'video_ad': return '视频广告'
      case 'sales_report': return '销售报表'
      case 'custom': return '自定义任务'
      default: return type
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'badge badge-yellow'
      case 'running': return 'badge badge-blue'
      case 'completed': return 'badge badge-green'
      case 'failed': return 'badge badge-red'
      default: return 'badge badge-gray'
    }
  }

  const getStatusName = (status: string) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'running': return '进行中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      default: return status
    }
  }

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <h2>任务管理</h2>
        <button
          onClick={handleCreateTestTask}
          className="btn-primary"
          style={{ padding: '6px 12px', fontSize: 14 }}
        >
          + 测试任务
        </button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            暂无任务，点击上方按钮创建测试任务
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={`card ${selectedTaskId === task.id ? 'selected' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">
                  {getTaskTypeName(task.type)}
                </span>
                <span className={getStatusBadgeClass(task.status)}>
                  {getStatusName(task.status)}
                </span>
              </div>
              
              {task.status === 'running' && (
                <div className="mb-2">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <div className="text-gray-400 text-xs mt-1">{Math.round(task.progress)}%</div>
                </div>
              )}
              
              {task.platform && (
                <div className="text-gray-400 text-xs">
                  平台: {task.platform}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
