'use client'

import { useState } from 'react'

interface Recommendation {
  destination: string;
  region: string;
  match_score: number;
  engagement_potential: string;
  budget_friendly: boolean;
  budget_estimate: { total: string };
  brand_partnerships: string[];
  local_creators: any[];
  events: Array<{ title: string; date: string }>;
  flight_link: string;
}

export default function TestNewFlow() {
  const [step, setStep] = useState(1)
  const [userPreferences, setUserPreferences] = useState({
    budgetRange: { min: 1000, max: 3000 },
    avoidedClimates: [] as string[],
    preferredRegions: [] as string[],
    contentTypes: [] as string[],
    visaFree: false
  })
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null)
  const [emailGenerated, setEmailGenerated] = useState(false)

  const handleGetRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'getFilteredRecommendations',
          userPreferences: userPreferences
        })
      })
      const data = await response.json()
      setRecommendations(data.recommendations)
      setStep(2)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const handleGetMoreRecommendations = async () => {
    setLoading(true)
    try {
      const currentDestinations = recommendations.map(r => r.destination)
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'getMoreRecommendations',
          userPreferences: userPreferences,
          currentDestinations: currentDestinations
        })
      })
      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const handleConfirmBooking = async (destination: string) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'confirmBooking',
          destination: destination,
          userEmail: 'user@example.com'
        })
      })
      const data = await response.json()
      setBookingConfirmed(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleGenerateEmail = async () => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'generateEmailReport',
          recommendations: recommendations,
          userEmail: 'user@example.com',
          userPreferences: userPreferences
        })
      })
      const data = await response.json()
      setEmailGenerated(true)
      
      // Open email content in new window
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(data.emailContent)
        newWindow.document.close()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">🌍 New TasteJourney Flow Test</h1>
      
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Set Your Travel Preferences</h2>
              
              {/* Budget Range */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">💰 Budget Range (USD)</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Min"
                    value={userPreferences.budgetRange.min}
                    onChange={(e) => setUserPreferences({
                      ...userPreferences,
                      budgetRange: { ...userPreferences.budgetRange, min: parseInt(e.target.value) }
                    })}
                    className="border p-2 rounded w-24"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={userPreferences.budgetRange.max}
                    onChange={(e) => setUserPreferences({
                      ...userPreferences,
                      budgetRange: { ...userPreferences.budgetRange, max: parseInt(e.target.value) }
                    })}
                    className="border p-2 rounded w-24"
                  />
                </div>
              </div>

              {/* Avoided Climates */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">🌡️ Avoid These Climates</h3>
                <div className="flex flex-wrap gap-2">
                  {['tropical', 'arid', 'temperate', 'mediterranean'].map(climate => (
                    <label key={climate} className="flex items-center">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUserPreferences({
                              ...userPreferences,
                              avoidedClimates: [...userPreferences.avoidedClimates, climate]
                            })
                          } else {
                            setUserPreferences({
                              ...userPreferences,
                              avoidedClimates: userPreferences.avoidedClimates.filter(c => c !== climate)
                            })
                          }
                        }}
                        className="mr-2"
                      />
                      {climate}
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Regions */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">🗺️ Preferred Regions</h3>
                <div className="flex flex-wrap gap-2">
                  {['Western Europe', 'East Asia', 'Southeast Asia', 'North America', 'Middle East'].map(region => (
                    <label key={region} className="flex items-center">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUserPreferences({
                              ...userPreferences,
                              preferredRegions: [...userPreferences.preferredRegions, region]
                            })
                          } else {
                            setUserPreferences({
                              ...userPreferences,
                              preferredRegions: userPreferences.preferredRegions.filter(r => r !== region)
                            })
                          }
                        }}
                        className="mr-2"
                      />
                      {region}
                    </label>
                  ))}
                </div>
              </div>

              {/* Visa Free */}
              <div className="p-4 border rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userPreferences.visaFree}
                    onChange={(e) => setUserPreferences({
                      ...userPreferences,
                      visaFree: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Only show visa-free destinations
                </label>
              </div>

              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Finding Destinations...' : 'Get My Top 3 Recommendations 🎯'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">🎯 Your Top 3 Destinations</h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Change Preferences
                </button>
              </div>

              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{index + 1}. {rec.destination}</h3>
                      <p className="text-gray-600">{rec.region}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {rec.match_score}% Match
                      </div>
                      <div className={`mt-1 px-2 py-1 rounded text-xs ${rec.budget_friendly ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {rec.budget_friendly ? 'Budget Friendly' : 'Premium'}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">🎯 ENGAGEMENT POTENTIAL</h4>
                      <p className="text-sm">{rec.engagement_potential}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">💰 BUDGET</h4>
                      <p className="text-sm">{rec.budget_estimate.total}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">🤝 BRAND PARTNERSHIPS</h4>
                      <p className="text-sm">{rec.brand_partnerships.slice(0, 3).join(', ')}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">👥 LOCAL CREATORS</h4>
                      <p className="text-sm">{rec.local_creators.length} creators available</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">🎪 UPCOMING EVENTS</h4>
                    <div className="text-sm space-y-1">
                      {rec.events.slice(0, 2).map((event, i) => (
                        <div key={i}>
                          <strong>{event.title}</strong> - {event.date}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={rec.flight_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Book Flights ✈️
                    </a>
                    <button
                      onClick={() => handleConfirmBooking(rec.destination)}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Confirm Booking 🎯
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleGetMoreRecommendations}
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Show 3 More Destinations 🔄'}
                </button>
                <button
                  onClick={handleGenerateEmail}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
                >
                  Generate Email Report 📧
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">📋 Status</h3>
            
            {bookingConfirmed && (
              <div className="bg-green-100 border border-green-300 p-3 rounded mb-3">
                <h4 className="font-semibold text-green-800">✅ Booking Confirmed!</h4>
                <p className="text-sm text-green-700">{bookingConfirmed.destination}</p>
                <p className="text-xs text-green-600">ID: {bookingConfirmed.bookingId}</p>
              </div>
            )}

            {emailGenerated && (
              <div className="bg-blue-100 border border-blue-300 p-3 rounded mb-3">
                <h4 className="font-semibold text-blue-800">📧 Email Generated!</h4>
                <p className="text-sm text-blue-700">Check the new window for your detailed report</p>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Preferences Set:</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex justify-between">
                <span>Destinations Found:</span>
                <span className="text-green-600">{recommendations.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Bookings:</span>
                <span className="text-green-600">{bookingConfirmed ? '1' : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email Reports:</span>
                <span className="text-green-600">{emailGenerated ? '1' : '0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
