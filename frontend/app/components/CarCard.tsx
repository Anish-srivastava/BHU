'use client'

import React from 'react'
import styles from './CarCard.module.css'

interface CarData {
  make: string
  model: string
  year: number
  manufacturing_co2: number
  use_phase_co2: number
  total_lifecycle_co2: number
}

interface CarCardProps {
  car: CarData
  index: number
  isLowest: boolean
}

export const CarCard: React.FC<CarCardProps> = ({ car, index, isLowest }) => {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className={`${styles.card} ${isLowest ? styles.highlight : ''}`}>
      <div className={styles.header}>
        <span className={styles.medal}>{medals[index]}</span>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>
            {car.make} {car.model}
          </h3>
          <p className={styles.year}>{car.year}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.emissionRow}>
          <span className={styles.label}>Manufacturing CO₂:</span>
          <span className={styles.value}>{car.manufacturing_co2} kg</span>
        </div>
        <div className={styles.emissionRow}>
          <span className={styles.label}>Use Phase CO₂:</span>
          <span className={styles.value}>{car.use_phase_co2} kg</span>
        </div>
        <div className={`${styles.emissionRow} ${styles.total}`}>
          <span className={styles.label}>Total Lifecycle CO₂:</span>
          <span className={styles.valueBold}>{car.total_lifecycle_co2} kg</span>
        </div>
      </div>

      {isLowest && (
        <div className={styles.badge}>
          ⭐ Lowest Emissions
        </div>
      )}
    </div>
  )
}

export default CarCard
