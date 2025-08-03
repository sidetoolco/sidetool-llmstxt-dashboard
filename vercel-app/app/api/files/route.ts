import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Check if generated files exist from the cron job
    const generatedFilesPath = path.join(process.cwd(), '..', 'generated-files', 'daily')
    const metadataPath = path.join(generatedFilesPath, 'generation-metadata.json')
    
    let files = {}
    let metadata = {
      timestamp: new Date().toISOString(),
      generatedFiles: 0,
      totalSize: 0,
      files: {}
    }

    // Try to read from generated files directory first
    if (fs.existsSync(metadataPath)) {
      const metadataContent = fs.readFileSync(metadataPath, 'utf8')
      metadata = JSON.parse(metadataContent)
      
      // Read actual file contents
      Object.entries(metadata.files).forEach(([key, fileInfo]: [string, any]) => {
        const filePath = path.join(generatedFilesPath, fileInfo.name)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8')
          files[key] = {
            ...fileInfo,
            content: content,
            size: content.length
          }
        }
      })
    }

    // If no files exist from cron job, return empty state
    if (Object.keys(files).length === 0) {
      return NextResponse.json({
        error: 'No files found. Please trigger a manual generation or wait for daily cron job.',
        fallback: true,
        date: new Date().toISOString().split('T')[0],
        stats: {
          totalFiles: 0,
          totalPosts: 0,
          newPostsToday: 0,
          totalKeywords: 0
        },
        files: {},
        source: 'no-files-available'
      }, { status: 404 })
    }

    const response = {
      date: new Date().toISOString().split('T')[0],
      stats: {
        totalFiles: metadata.generatedFiles,
        totalPosts: 5, // Based on mock data
        newPostsToday: 1,
        totalKeywords: 15
      },
      files: files,
      generatedAt: metadata.timestamp,
      source: fs.existsSync(metadataPath) ? 'cron-job' : 'on-demand'
    }

    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('Error loading files:', error)
    
    return NextResponse.json({
      error: 'Failed to load files from database',
      details: error.message,
      suggestion: 'Please use the "Generate Now" button to create new files'
    }, { status: 500 })
  }
}