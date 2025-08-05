import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'POST /api/trigger-generation',
    },
    async (span) => {
      try {
        const { logger } = Sentry
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        logger.info('Triggering manual LLMs.txt generation', {
          trigger: 'manual',
          timestamp: new Date().toISOString()
        })

        // Call the Edge Function to generate new files
        const { data, error } = await Sentry.startSpan(
          {
            op: 'supabase.function',
            name: 'generate-llms-daily',
          },
          async () => {
            return await supabase.functions.invoke('generate-llms-daily', {
              body: { trigger: 'manual', timestamp: new Date().toISOString() }
            })
          }
        )

        if (error) {
          logger.error('Error triggering generation', {
            error: error.message,
            code: error.code
          })
          Sentry.captureException(error, {
            tags: {
              operation: 'manual-generation',
              error_type: 'supabase-function-error'
            }
          })
          return NextResponse.json({
            success: false,
            error: 'Failed to trigger generation',
            details: error.message
          }, { status: 500 })
        }

        logger.info('Manual generation triggered successfully', {
          generation_data: data
        })

        span.setAttribute('generation.success', true)
        span.setAttribute('generation.trigger', 'manual')

        return NextResponse.json({
          success: true,
          message: 'Generation triggered successfully',
          data,
          triggeredAt: new Date().toISOString()
        })

      } catch (error: any) {
        const { logger } = Sentry
        logger.error('Manual generation error', {
          error: error.message,
          stack: error.stack
        })
        Sentry.captureException(error, {
          tags: {
            operation: 'manual-generation',
            error_type: 'unexpected-error'
          }
        })
        return NextResponse.json({
          success: false,
          error: 'Failed to trigger manual generation',
          details: error.message
        }, { status: 500 })
      }
    }
  )
}