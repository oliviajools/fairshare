'use client'

interface PieChartData {
  name: string
  value: number
  color?: string
}

interface PieChartProps {
  data: PieChartData[]
  size?: number
  showLabels?: boolean
  showLegend?: boolean
}

const COLORS = [
  '#0ea5e9', // sky-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
]

export function PieChart({ data, size = 200, showLabels = true, showLegend = true }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div 
          style={{ width: size, height: size }}
          className="rounded-full bg-gray-200 flex items-center justify-center"
        >
          <span className="text-gray-400 text-sm">0%</span>
        </div>
      </div>
    )
  }

  interface SliceData {
    path: string
    color: string
    name: string
    value: number
    percentage: number
    labelX: number
    labelY: number
    endAngle: number
  }

  const slices = data
    .filter(item => item.value > 0)
    .reduce<SliceData[]>((acc, item, index) => {
      const currentAngle = acc.length === 0 ? -90 : acc[acc.length - 1].endAngle
      const percentage = (item.value / total) * 100
      const angle = (item.value / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const radius = size / 2
      const centerX = size / 2
      const centerY = size / 2

      const x1 = centerX + radius * Math.cos(startRad)
      const y1 = centerY + radius * Math.sin(startRad)
      const x2 = centerX + radius * Math.cos(endRad)
      const y2 = centerY + radius * Math.sin(endRad)

      const largeArcFlag = angle > 180 ? 1 : 0

      const pathData = percentage === 100
        ? `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX - 0.01} ${centerY - radius} Z`
        : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

      // Calculate label position
      const midAngle = (startAngle + endAngle) / 2
      const midRad = (midAngle * Math.PI) / 180
      const labelRadius = radius * 0.65
      const labelX = centerX + labelRadius * Math.cos(midRad)
      const labelY = centerY + labelRadius * Math.sin(midRad)

      acc.push({
        path: pathData,
        color: item.color || COLORS[index % COLORS.length],
        name: item.name,
        value: item.value,
        percentage,
        labelX,
        labelY,
        endAngle
      })
      return acc
    }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            {showLabels && slice.percentage >= 8 && (
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                className="pointer-events-none"
              >
                {Math.round(slice.percentage)}%
              </text>
            )}
          </g>
        ))}
      </svg>
      
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 max-w-xs">
          {data.filter(item => item.value > 0).map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-gray-600 truncate max-w-[80px]">
                {item.name}
              </span>
              <span className="text-xs font-medium text-gray-900">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
