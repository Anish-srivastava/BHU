'use client'

import React, { useState } from 'react'
import styles from './page.module.css'

// Existing components (segment compare)
import InputForm from './components/InputForm'
import CarCard from './components/CarCard'
import ComparisonChart from './components/ComparisonChart'

// New components
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import ComparisonTable, { type SearchCarResult } from './components/ComparisonTable'
import DashboardCharts from './components/DashboardCharts'

import { vehicleAPI } from './api/vehicleAPI'

// ── Types ──────────────────────────────────────────────────────────────────

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

interface SearchResult {
  lifetime_km: number
  vehicles: SearchCarResult[]
}

type Tab = 'search' | 'dashboard' | 'segment'

// ── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('search')

  // Search & Compare state
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Segment Compare state (existing functionality)
  const [segmentResults, setSegmentResults] = useState<ComparisonResult | null>(null)
  const [segmentLoading, setSegmentLoading] = useState(false)
  const [segmentError, setSegmentError] = useState('')
  const [segmentParams, setSegmentParams] = useState({
    dailyMileage: 0,
    ownershipYears: 0,
    vehicleSegment: '',
  })

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSearch = async (
    queries: string[],
    dailyMileage: number,
    ownershipYears: number
  ) => {
    setSearchLoading(true)
    setSearchError('')
    try {
      const data = await vehicleAPI.searchModels(queries, dailyMileage, ownershipYears)
      setSearchResults(data)
      if (!data.vehicles || data.vehicles.length === 0) {
        setSearchError('No vehicles found for the provided model names in the current dataset.')
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.detail || 'Search failed. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSegmentSubmit = async (
    dailyMileage: number,
    ownershipYears: number,
    vehicleSegment: string
  ) => {
    setSegmentLoading(true)
    setSegmentError('')
    setSegmentResults(null)
    try {
      const data = await vehicleAPI.compareVehicles(dailyMileage, ownershipYears, vehicleSegment)
      setSegmentResults(data)
      setSegmentParams({ dailyMileage, ownershipYears, vehicleSegment })
    } catch (err: any) {
      setSegmentError(err.response?.data?.detail || 'Failed to fetch comparison results')
    } finally {
      setSegmentLoading(false)
    }
  }

  // ── Tab header text ──────────────────────────────────────────────────────

  const TAB_HEADING: Record<Tab, string> = {
    search: '🔍 Search & Compare Vehicles',
    dashboard: '📊 Carbon Dashboard',
    segment: '🚗 Segment Comparison',
  }
  const TAB_SUBTITLE: Record<Tab, string> = {
    search: 'Search vehicle models (partial match) and compare carbon footprints side-by-side',
    dashboard: 'Visualise upfront manufacturing carbon cost and long-term CO₂ savings',
    segment: 'Find the 3 lowest-emission vehicles within a specific vehicle segment',
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.appLayout}>
      <Sidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as Tab)} />

      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{TAB_HEADING[activeTab]}</h1>
            <p className={styles.subtitle}>{TAB_SUBTITLE[activeTab]}</p>
          </div>
        </header>

        <main className={styles.mainArea}>

          {/* ═══════════════ SEARCH & COMPARE TAB ═══════════════ */}
          {activeTab === 'search' && (
            <div className={styles.tabContent}>
              <section className={styles.section}>
                <SearchBar
                  dailyMileage={50}
                  ownershipYears={5}
                  onSearch={handleSearch}
                  isLoading={searchLoading}
                />
              </section>

              {searchError && (
                <div className={styles.errorBanner}>❌ {searchError}</div>
              )}

              {searchLoading && <LoadingState />}

              {searchResults && !searchLoading && searchResults.vehicles.length > 0 && (
                <>
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📊 Results Overview</h2>
                    <DashboardCharts
                      vehicles={searchResults.vehicles}
                      lifetimeKm={searchResults.lifetime_km}
                    />
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                      📋 Comparison Table
                      <span className={styles.badge}>{searchResults.vehicles.length} vehicles</span>
                    </h2>
                    <ComparisonTable
                      vehicles={searchResults.vehicles}
                      lifetimeKm={searchResults.lifetime_km}
                    />
                  </section>
                </>
              )}

              {searchResults && !searchLoading && searchResults.vehicles.length === 0 && (
                <EmptyState
                  icon="🔎"
                  heading="No Matching Vehicles"
                  body="Try a different model name (for example: Civic, Corolla, Camry)."
                />
              )}

              {!searchResults && !searchLoading && !searchError && (
                <EmptyState
                  icon="🔍"
                  heading="Search for Vehicles to Compare"
                  body='Enter one or more model names above. Use "+" to add models for side-by-side comparison.'
                />
              )}
            </div>
          )}

          {/* ═══════════════ DASHBOARD TAB ═══════════════ */}
          {activeTab === 'dashboard' && (
            <div className={styles.tabContent}>
              {searchResults && searchResults.vehicles.length > 0 ? (
                <>
                  <div className={styles.dashboardBanner}>
                    <p>
                      Showing dashboard for{' '}
                      <strong>{searchResults.vehicles.length}</strong> vehicles over{' '}
                      <strong>{searchResults.lifetime_km.toLocaleString()} km</strong> lifetime distance.
                    </p>
                  </div>

                  <DashboardCharts
                    vehicles={searchResults.vehicles}
                    lifetimeKm={searchResults.lifetime_km}
                  />

                  {/* Key Insights */}
                  <div style={{ marginTop: 36 }}>
                    <h2 className={styles.sectionTitle}>💡 Key Insights</h2>
                    <div className={styles.insightGrid}>
                      <InsightCard
                        icon="🏭"
                        title="Upfront Carbon Cost"
                        desc={`On average, manufacturing emits ${Math.round(
                          searchResults.vehicles.reduce((a, v) => a + v.manufacturing_co2, 0) /
                            searchResults.vehicles.length
                        ).toLocaleString()} kg CO₂ before the vehicle is even driven.`}
                        color="#f59e0b"
                      />
                      <InsightCard
                        icon="♻️"
                        title="Long-Term Savings Potential"
                        desc={`Choosing the top-ranked vehicle over the worst saves up to ${Math.max(
                          ...searchResults.vehicles.map((v) => v.long_term_savings)
                        ).toLocaleString()} kg CO₂ over the ownership period.`}
                        color="#10b981"
                      />
                      <InsightCard
                        icon="⚡"
                        title="Best Performing Vehicle"
                        desc={`${searchResults.vehicles[0].make} ${searchResults.vehicles[0].model} (${
                          searchResults.vehicles[0].year
                        }) leads with ${searchResults.vehicles[0].total_co2.toLocaleString()} kg total lifecycle CO₂.`}
                        color="#3b82f6"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="📊"
                  heading="No Data Yet"
                  body="Go to Search & Compare and search for vehicles first to populate the dashboard."
                  cta="Go to Search"
                  onCta={() => setActiveTab('search')}
                />
              )}
            </div>
          )}

          {/* ═══════════════ SEGMENT COMPARE TAB ═══════════════ */}
          {activeTab === 'segment' && (
            <div className={styles.tabContent}>
              <section className={styles.section}>
                <InputForm onSubmit={handleSegmentSubmit} isLoading={segmentLoading} />
              </section>

              {segmentError && (
                <div className={styles.errorBanner}>❌ {segmentError}</div>
              )}

              {segmentLoading && <LoadingState />}

              {segmentResults && !segmentLoading && (
                <>
                  <section className={styles.section}>
                    <div className={styles.summaryRow}>
                      <SumCard icon="📍" label="Daily Mileage" value={`${segmentParams.dailyMileage} km`} />
                      <SumCard icon="📅" label="Ownership Period" value={`${segmentParams.ownershipYears} yrs`} />
                      <SumCard icon="🛣️" label="Lifetime Distance" value={`${segmentResults.lifetime_km.toLocaleString()} km`} />
                      <SumCard icon="🏷️" label="Segment" value={segmentParams.vehicleSegment} />
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🥇 Top 3 Lowest Emission Vehicles</h2>
                    <div className={styles.carGrid}>
                      {segmentResults.top_3_cars.map((car, index) => (
                        <CarCard
                          key={`${car.make}-${car.model}-${car.year}`}
                          car={car}
                          index={index}
                          isLowest={index === 0}
                        />
                      ))}
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📈 CO₂ Breakdown</h2>
                    <div className={styles.chartContainer}>
                      <ComparisonChart cars={segmentResults.top_3_cars} />
                    </div>
                  </section>
                </>
              )}

              {!segmentResults && !segmentLoading && !segmentError && (
                <EmptyState
                  icon="🚗"
                  heading="Compare by Vehicle Segment"
                  body="Select your driving parameters and a vehicle segment to find the top 3 lowest-emission vehicles."
                />
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

// ── Reusable mini-components ───────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        padding: '60px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          width: 48,
          height: 48,
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
        }}
      />
      <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
        Analysing vehicles and calculating emissions…
      </p>
    </div>
  )
}

function EmptyState({
  icon,
  heading,
  body,
  cta,
  onCta,
}: {
  icon: string
  heading: string
  body: string
  cta?: string
  onCta?: () => void
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        padding: '60px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        marginTop: 8,
      }}
    >
      <div style={{ fontSize: 60, marginBottom: 20 }}>{icon}</div>
      <h2 style={{ fontSize: 22, color: '#1f2937', marginBottom: 12 }}>{heading}</h2>
      <p
        style={{
          color: '#6b7280',
          fontSize: 15,
          maxWidth: 440,
          margin: '0 auto',
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
      {cta && onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop: 20,
            padding: '12px 28px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {cta}
        </button>
      )}
    </div>
  )
}

function InsightCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: string
  title: string
  desc: string
  color: string
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderTop: `4px solid ${color}`,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
      >
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
          {title}
        </h3>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  )
}

function SumCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'white',
        padding: '14px 18px',
        borderRadius: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderLeft: '4px solid #10b981',
        flex: 1,
        minWidth: 160,
      }}
    >
      <span style={{ fontSize: 22, minWidth: 36, textAlign: 'center' }}>{icon}</span>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
          }}
        >
          {label}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

