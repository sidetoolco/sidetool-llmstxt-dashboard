'use client'

import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function SentryExamplePage() {
  const [loading, setLoading] = useState(false)

  const triggerError = () => {
    // This will be captured by Sentry
    throw new Error('Test error from Sentry example page!')
  }

  const triggerAsyncError = async () => {
    setLoading(true)
    try {
      // Simulate an async operation that fails
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Async test error from Sentry!'))
        }, 1000)
      })
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test: true,
          source: 'sentry-example-page'
        }
      })
      alert('Error captured and sent to Sentry!')
    } finally {
      setLoading(false)
    }
  }

  const triggerPerformanceTest = async () => {
    await Sentry.startSpan(
      {
        op: 'test.performance',
        name: 'Sentry Performance Test',
      },
      async (span) => {
        span.setAttribute('test.type', 'performance')
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 500))
        
        await Sentry.startSpan(
          {
            op: 'test.child',
            name: 'Child Operation',
          },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        )
        
        span.setAttribute('test.completed', true)
        alert('Performance test completed! Check Sentry for the trace.')
      }
    )
  }

  const testLogging = () => {
    const { logger } = Sentry
    
    logger.info('Test info log from Sentry example page', {
      user: 'test-user',
      action: 'button-click'
    })
    
    logger.warn('Test warning log', {
      warning: 'This is a test warning',
      severity: 'medium'
    })
    
    logger.error('Test error log', {
      error: 'This is a test error log',
      critical: false
    })
    
    alert('Logs sent to Sentry! Check your Sentry dashboard.')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sentry Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Error Testing</h2>
            <div className="space-y-4">
              <button
                onClick={triggerError}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Trigger Sync Error
              </button>
              
              <button
                onClick={triggerAsyncError}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Trigger Async Error'}
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Testing</h2>
            <button
              onClick={triggerPerformanceTest}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Performance Monitoring
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Logging Testing</h2>
            <button
              onClick={testLogging}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Logging
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">
              After clicking these buttons, check your Sentry dashboard at:
              <br />
              <a 
                href="https://towr-sidetool.sentry.io/issues/?project=4509789473996800"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://towr-sidetool.sentry.io/issues/
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}