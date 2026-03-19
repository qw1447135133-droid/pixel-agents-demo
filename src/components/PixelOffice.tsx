import { useEffect, useRef, useState } from 'react'

// 部门类型
type DepartmentType = 'finance' | 'design' | 'marketing' | 'ceo' | 'hr'

interface Department {
  id: DepartmentType
  name: string
  icon: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

// 部门数据
const departments: Department[] = [
  { id: 'ceo', name: 'BOSS', icon: '👔', x: 40, y: 30, width: 160, height: 120, color: '#4A90D9' },
  { id: 'finance', name: 'MONEY', icon: '💰', x: 220, y: 30, width: 140, height: 120, color: '#50C878' },
  { id: 'design', name: 'ART', icon: '🎨', x: 40, y: 170, width: 140, height: 140, color: '#E74C3C' },
  { id: 'marketing', name: 'SELL', icon: '📢', x: 200, y: 170, width: 160, height: 140, color: '#F39C12' },
  { id: 'hr', name: 'PEOPLE', icon: '👥', x: 120, y: 330, width: 160, height: 100, color: '#9B59B6' }
]

// 像素风格渲染参数
const PIXEL_FONT = "'Press Start 2P', 'Courier New', monospace"

export function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredDept, setHoveredDept] = useState<DepartmentType | null>(null)
  const [clickedDept, setClickedDept] = useState<DepartmentType | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置Canvas尺寸
    const dpr = window.devicePixelRatio || 1
    const CANVAS_WIDTH = 400
    const CANVAS_HEIGHT = 450
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    canvas.style.width = `${CANVAS_WIDTH}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    ctx.scale(dpr, dpr)

    // 像素化渲染设置
    ctx.imageSmoothingEnabled = false

    // 简单绘制函数
    const render = () => {
      // 清空画布
      ctx.fillStyle = '#0f0f1a'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // 绘制简单网格
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      for (let y = 0; y < CANVAS_HEIGHT; y += 16) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_WIDTH, y)
        ctx.stroke()
      }
      for (let x = 0; x < CANVAS_WIDTH; x += 16) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.stroke()
      }

      // 绘制部门房间
      departments.forEach(dept => {
        const isHovered = hoveredDept === dept.id
        const isClicked = clickedDept === dept.id
        const scale = isHovered ? 1.04 : 1

        ctx.save()
        
        // 居中缩放
        const centerX = dept.x + dept.width / 2
        const centerY = dept.y + dept.height / 2
        ctx.translate(centerX, centerY)
        ctx.scale(scale, scale)
        ctx.translate(-centerX, -centerY)

        // 房间阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(dept.x + 4, dept.y + 4, dept.width, dept.height)

        // 房间主色
        ctx.fillStyle = dept.color
        ctx.fillRect(dept.x, dept.y, dept.width, dept.height)

        // 像素边框
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 4
        ctx.strokeRect(dept.x, dept.y, dept.width, dept.height)
        
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.strokeRect(dept.x + 2, dept.y + 2, dept.width - 4, dept.height - 4)

        // 高亮边框
        if (isHovered || isClicked) {
          ctx.strokeStyle = '#ffff00'
          ctx.lineWidth = 6
          ctx.strokeRect(dept.x - 1, dept.y - 1, dept.width + 2, dept.height + 2)
        }

        // 图标
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        ctx.fillStyle = '#000'
        ctx.fillText(dept.icon, centerX + 2, centerY - 8)
        
        ctx.fillStyle = '#fff'
        ctx.fillText(dept.icon, centerX, centerY - 10)

        // 部门名称
        ctx.font = `bold 12px ${PIXEL_FONT}`
        ctx.fillStyle = '#000'
        ctx.fillText(dept.name, centerX + 1, centerY + 26)
        ctx.fillStyle = '#fff'
        ctx.fillText(dept.name, centerX, centerY + 24)

        ctx.restore()
      })

      // 绘制弹出面板
      if (clickedDept) {
        const dept = departments.find(d => d.id === clickedDept)
        if (dept) {
          // 半透明遮罩
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

          // 面板位置和尺寸
          const panelX = 40
          const panelY = 60
          const panelW = 320
          const panelH = 330
          
          // 面板背景
          ctx.fillStyle = '#1a1a2e'
          ctx.fillRect(panelX, panelY, panelW, panelH)

          // 面板边框
          ctx.strokeStyle = '#4a90d9'
          ctx.lineWidth = 6
          ctx.strokeRect(panelX, panelY, panelW, panelH)
          
          ctx.strokeStyle = '#333'
          ctx.lineWidth = 2
          ctx.strokeRect(panelX + 3, panelY + 3, panelW - 6, panelH - 6)

          // 标题栏
          ctx.fillStyle = '#0a0a1a'
          ctx.fillRect(panelX, panelY, panelW, 56)
          
          ctx.strokeStyle = '#4a90d9'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(panelX, panelY + 56)
          ctx.lineTo(panelX + panelW, panelY + 56)
          ctx.stroke()

          // 标题
          ctx.font = `bold 14px ${PIXEL_FONT}`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#00d4ff'
          ctx.fillText(`${dept.icon} ${dept.name}`, panelX + 16, panelY + 28)

          // 关闭按钮
          const btnX = panelX + panelW - 60
          const btnY = panelY + 14
          const btnW = 44
          const btnH = 28

          ctx.fillStyle = '#e74c3c'
          ctx.fillRect(btnX, btnY, btnW, btnH)
          
          ctx.strokeStyle = '#c0392b'
          ctx.lineWidth = 3
          ctx.strokeRect(btnX, btnY, btnW, btnH)

          ctx.font = `bold 20px ${PIXEL_FONT}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#fff'
          ctx.fillText('X', btnX + btnW / 2, btnY + btnH / 2)

          // 面板内容
          ctx.font = `10px ${PIXEL_FONT}`
          ctx.textAlign = 'left'
          ctx.fillStyle = '#aaa'
          ctx.fillText('WORK IN PROGRESS...', panelX + 20, panelY + 100)
          ctx.fillText('COMING SOON!', panelX + 20, panelY + 130)
        }
      }
    }

    // 初始渲染
    render()

    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let newHovered: DepartmentType | null = null
      departments.forEach(dept => {
        if (x >= dept.x && x <= dept.x + dept.width &&
            y >= dept.y && y <= dept.y + dept.height) {
          newHovered = dept.id
        }
      })

      if (newHovered !== hoveredDept) {
        setHoveredDept(newHovered)
        render()
      }
    }

    // 鼠标点击事件
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // 检查是否点击了关闭按钮
      if (clickedDept) {
        if (x >= 300 && x <= 344 && y >= 74 && y <= 102) {
          setClickedDept(null)
          render()
          return
        }
      }

      // 检查是否点击了部门房间
      let newClicked: DepartmentType | null = null
      departments.forEach(dept => {
        if (x >= dept.x && x <= dept.x + dept.width &&
            y >= dept.y && y <= dept.y + dept.height) {
          newClicked = dept.id
        }
      })

      if (newClicked !== clickedDept) {
        setClickedDept(newClicked)
        render()
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [hoveredDept, clickedDept])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#050510'
    }}>
      <canvas
        ref={canvasRef}
        style={{ 
          cursor: 'pointer',
          imageRendering: 'pixelated',
          imageRendering: 'crisp-edges'
        }}
      />
    </div>
  )
}
