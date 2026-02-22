'use client'

import React, { useState } from 'react'
import styles from './page.module.css'
import InputForm from './components/InputForm'
import CarCard from './components/CarCard'
import ComparisonChart from './components/ComparisonChart'
import { vehicleAPI } from './api/vehicleAPI'

interface CarData {
  make: string
  model: string
  year: number
  manufacturing_co2: number
  use_phase_co2: number
  total_lifecycle_co2: number
}

interface ComparisonResult {
  lifetime_km: number
  top_3_cars: CarData[]
}

export default function Home() {
  const [results, setResults] = useState<ComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [inputParams, setInputParams] = useState({
    dailyMileage: 0,
    ownershipYears: 0,
    vehicleSegment: '',
  })

  const handleFormSubmit = async (
    dailyMileage: number,
    ownershipYears: number,
    vehicleSegment: string
  ) => {
    setIsLoading(true)
    setError('')
    setResults(null)

    try {
      const data = await vehicleAPI.compareVehicles(
        dailyMileage,
        ownershipYears,
        vehicleSegment
      )
      setResults(data)
      setInputParams({ dailyMileage, ownershipYears, vehicleSegment })
    } catch (err: any) {
      console.error(err)
      const errorMessage = err.response?.data?.detail || 'Failed to fetch comparison results'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            🌍 Carbon-Wise
          </div>
          <h1 className={styles.title}>
            Vehicle Lifecycle CO₂ Comparison Engine
          </h1>
          <p className={styles.subtitle}>
            Make informed decisions about your vehicle choice based on total lifecycle emissions
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.container}>
        <section className={styles.section}>
          <InputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        </section>

        {/* Results Section */}
        {results && (
          <section className={styles.section}>
            <div className={styles.resultsSummary}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryIcon}>📍</span>
                <div>
                  <p className={styles.summaryLabel}>Daily Mileage</p>
                  <p className={styles.summaryValue}>{inputParams.dailyMileage} km</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryIcon}>📅</span>
                <div>
                  <p className={styles.summaryLabel}>Ownership Period</p>
                  <p className={styles.summaryValue}>{inputParams.ownershipYears} years</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryIcon}>🚗</span>
                <div>
                  <p className={styles.summaryLabel}>Total Lifetime Distance</p>
                  <p className={styles.summaryValue}>{results.lifetime_km.toLocaleString()} km</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryIcon}>🌿</span>
                <div>
                  <p className={styles.summaryLabel}>Top Car CO₂</p>
                  <p className={styles.summaryValue}>
                    {results.top_3_cars[0].total_lifecycle_co2.toLocaleString()} kg
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Cars Cards */}
        {results && results.top_3_cars.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Top 3 Lowest Emission Vehicles
            </h2>
            <div className={styles.carGrid}>
              {results.top_3_cars.map((car, index) => (
                <CarCard
                  key={`${car.make}-${car.model}-${car.year}`}
                  car={car}
                  index={index}
                  isLowest={index === 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Chart */}
        {results && results.top_3_cars.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              CO₂ Emissions Breakdown
            </h2>
            <div className={styles.chartContainer}>
              <ComparisonChart cars={results.top_3_cars} />
            </div>
            <div className={styles.chartLegend}>
              <p>
                The chart above shows the breakdown of manufacturing emissions and use-phase
                emissions for each of the top 3 vehicles. Manufacturing CO₂ represents the carbon
                footprint from production, while use-phase CO₂ is from driving over your specified
                ownership period.
              </p>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!results && !isLoading && (
          <section className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2>Ready to Compare?</h2>
            <p>
              Enter your daily mileage, ownership period, and select a vehicle segment to see
              which cars have the lowest lifecycle CO₂ emissions.
            </p>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <section className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Analyzing vehicles and calculating emissions...</p>
          </section>
        )}

        {/* Error State */}
        {error && (
          <section className={styles.errorState}>
            <div className={styles.errorIcon}>❌</div>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button
              onClick={() => {
                setError('')
                setResults(null)
              }}
              className={styles.retryBtn}
            >
              Try Again
            </button>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          Carbon-Wise © 2026 | Making Sustainable Transportation Choices Easy
        </p>
      </footer>
    </div>
  )
}
