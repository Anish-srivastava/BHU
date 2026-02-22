'use client'

import React, { useState, useEffect } from 'react'
import styles from './InputForm.module.css'
import { vehicleAPI } from '../api/vehicleAPI'

interface InputFormProps {
  onSubmit: (dailyMileage: number, ownershipYears: number, vehicleSegment: string) => void
  isLoading: boolean
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [dailyMileage, setDailyMileage] = useState<number>(50)
  const [ownershipYears, setOwnershipYears] = useState<number>(5)
  const [vehicleSegment, setVehicleSegment] = useState<string>('')
  const [segments, setSegments] = useState<string[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await vehicleAPI.getSegments()
        setSegments(data.segments)
        if (data.segments.length > 0) {
          setVehicleSegment(data.segments[0])
        }
      } catch (err) {
        setError('Failed to load vehicle segments')
        console.error(err)
      }
    }

    fetchSegments()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleSegment) {
      setError('Please select a vehicle segment')
      return
    }

    if (dailyMileage <= 0 || ownershipYears <= 0) {
      setError('Mileage and ownership years must be positive numbers')
      return
    }

    setError('')
    onSubmit(dailyMileage, ownershipYears, vehicleSegment)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label htmlFor="dailyMileage" className={styles.label}>
            Daily Mileage (km)
          </label>
          <input
            id="dailyMileage"
            type="number"
            min="1"
            step="0.1"
            value={dailyMileage}
            onChange={(e) => setDailyMileage(parseFloat(e.target.value) || 0)}
            className={styles.input}
            disabled={isLoading}
          />
          <span className={styles.hint}>
            Your average daily driving distance
          </span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="ownershipYears" className={styles.label}>
            Ownership Period (years)
          </label>
          <input
            id="ownershipYears"
            type="number"
            min="0.5"
            step="0.5"
            value={ownershipYears}
            onChange={(e) => setOwnershipYears(parseFloat(e.target.value) || 1)}
            className={styles.input}
            disabled={isLoading}
          />
          <span className={styles.hint}>
            How long you plan to keep the vehicle
          </span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="vehicleSegment" className={styles.label}>
            Vehicle Segment
          </label>
          <select
            id="vehicleSegment"
            value={vehicleSegment}
            onChange={(e) => setVehicleSegment(e.target.value)}
            className={styles.select}
            disabled={isLoading || segments.length === 0}
          >
            <option value="">Select a segment</option>
            {segments.map((segment) => (
              <option key={segment} value={segment}>
                {segment}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            Choose the type of vehicle
          </span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isLoading || segments.length === 0}
      >
        {isLoading ? '🔄 Comparing...' : '🔍 Compare Vehicles'}
      </button>
    </form>
  )
}

export default InputForm
