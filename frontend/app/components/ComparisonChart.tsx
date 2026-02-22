'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface CarData {
  make: string
  model: string
  year: number
  manufacturing_co2: number
  use_phase_co2: number
  total_lifecycle_co2: number
}

interface ComparisonChartProps {
  cars: CarData[]
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ cars }) => {
  const labels = cars.map(car => `${car.make} ${car.model}`)

  const data = {
    labels,
    datasets: [
      {
        label: 'Manufacturing CO₂ (kg)',
        data: cars.map(car => car.manufacturing_co2),
        backgroundColor: '#f59e0b',
        borderRadius: 6,
      },
      {
        label: 'Use Phase CO₂ (kg)',
        data: cars.map(car => car.use_phase_co2),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      title: {
        display: true,
        text: 'CO₂ Emissions Breakdown',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: false,
        title: {
          display: true,
          text: 'CO₂ (kg)',
        },
      },
    },
  }

  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  )
}

export default ComparisonChart
