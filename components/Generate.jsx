'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@descope/nextjs-sdk/client'

export default function Generate() {
  const [message, setMessage] = useState('')
  const [responses, setResponses] = useState([])
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  const [parameters, setParameters] = useState({
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    max_tokens: 256,
    frequency_penalty: 0,
    presence_penalty: 0
  })
  
  const { user, isUserLoading } = useUser()

  const API_BASE_URL = 'http://localhost:5000'

  // Check API health on component mount
  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      
      if (data.status === 'healthy') {
        setApiStatus('healthy')
      } else {
        setApiStatus('partial')
      }
    } catch (error) {
      setApiStatus('error')
    }
  }

  const loadDefaults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/parameters/defaults`)
      const data = await response.json()
      setParameters(data.defaults)
      alert('Parameters reset to defaults!')
    } catch (error) {
      alert('Failed to load defaults: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsLoading(true)

    try {
      const requestBody = {
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        ...parameters
      }
      
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || 'No response content'
        
        const newResponse = {
          id: Date.now(),
          prompt: message,
          content: content,
          timestamp: new Date().toLocaleString(),
          parameters: { ...parameters }
        }
        
        setResponses(prev => [newResponse, ...prev])
        setCurrentResponseIndex(0)
      } else {
        const errorData = await response.json()
        const errorResponse = {
          id: Date.now(),
          prompt: message,
          content: `Error: ${errorData.error || 'Unknown error'}`,
          timestamp: new Date().toLocaleString(),
          isError: true
        }
        setResponses(prev => [errorResponse, ...prev])
        setCurrentResponseIndex(0)
      }
    } catch (error) {
      const errorResponse = {
        id: Date.now(),
        prompt: message,
        content: `Network error: ${error.message}`,
        timestamp: new Date().toLocaleString(),
        isError: true
      }
      setResponses(prev => [errorResponse, ...prev])
      setCurrentResponseIndex(0)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusDisplay = () => {
    switch (apiStatus) {
      case 'healthy':
        return { text: 'Connected to LLM API ✓', className: 'text-green-600 bg-green-100' }
      case 'partial':
        return { text: 'API partially available - LM Studio not connected', className: 'text-yellow-600 bg-yellow-100' }
      case 'error':
        return { text: 'Cannot connect to API server', className: 'text-red-600 bg-red-100' }
      default:
        return { text: 'Checking connection...', className: 'text-gray-600 bg-gray-100' }
    }
  }

  // Show loading if user data is still loading
  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="text-center mt-20">
        <p className="text-lg mb-4">Please log in to access this page.</p>
        <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
          Go to Login
        </Link>
      </div>
    )
  }

  const status = getStatusDisplay()

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            🤖 LLM API Interface
          </h1>
          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${status.className}`}>
            {status.text}
          </div>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/" 
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back Home
          </Link>
          <Link 
            href="/logout" 
            className="px-4 py-2 border rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Logout
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message:
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={loadDefaults}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Parameters */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(parameters).map(([key, value]) => {
                const configs = {
                  temperature: { min: 0, max: 2, step: 0.1, label: 'Temperature' },
                  top_p: { min: 0, max: 1, step: 0.05, label: 'Top P' },
                  top_k: { min: 1, max: 100, step: 1, label: 'Top K' },
                  max_tokens: { min: 1, max: 1000, step: 1, label: 'Max Tokens' },
                  frequency_penalty: { min: -2, max: 2, step: 0.1, label: 'Frequency Penalty' },
                  presence_penalty: { min: -2, max: 2, step: 0.1, label: 'Presence Penalty' }
                }
                
                const config = configs[key]
                if (!config) return null
                
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {config.label}
                    </label>
                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={value}
                      onChange={(e) => setParameters(prev => ({
                        ...prev,
                        [key]: parseFloat(e.target.value)
                      }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-xs text-gray-500">
                      Current: <span className="font-medium">{value}</span> ({config.min} - {config.max})
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Response Carousel */}
        <div className="space-y-6">
          {responses.length > 0 && (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Responses</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {currentResponseIndex + 1} of {responses.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentResponseIndex(prev => 
                        prev > 0 ? prev - 1 : responses.length - 1
                      )}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      disabled={responses.length <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentResponseIndex(prev => 
                        prev < responses.length - 1 ? prev + 1 : 0
                      )}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      disabled={responses.length <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Response */}
              {responses[currentResponseIndex] && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium mb-1">Prompt:</div>
                    <div className="text-gray-800">{responses[currentResponseIndex].prompt}</div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${responses[currentResponseIndex].isError ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className="text-sm text-gray-600 font-medium mb-2">Response:</div>
                    <div className={`whitespace-pre-wrap ${responses[currentResponseIndex].isError ? 'text-red-700' : 'text-gray-800'}`}>
                      {responses[currentResponseIndex].content}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{responses[currentResponseIndex].timestamp}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(responses[currentResponseIndex].content)}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Response Dots Indicator */}
              {responses.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {responses.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentResponseIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentResponseIndex ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {responses.length === 0 && !isLoading && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l2.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                <p className="text-lg font-medium">No responses yet</p>
                <p className="text-sm">Send a message to see responses here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}