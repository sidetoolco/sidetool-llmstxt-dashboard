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

    // If no files exist from cron job, fall back to generating them on-demand
    if (Object.keys(files).length === 0) {
      // Import the generator
      const { generateMultipleLLMsFiles } = await import('../../scripts/llms-file-generator.js')
      files = await generateMultipleLLMsFiles()
      
      // Update metadata
      metadata = {
        timestamp: new Date().toISOString(),
        generatedFiles: Object.keys(files).length,
        totalSize: Object.values(files).reduce((sum: number, f: any) => sum + f.content.length, 0),
        files: Object.fromEntries(
          Object.entries(files).map(([key, file]: [string, any]) => [
            key, 
            { 
              name: file.name, 
              size: file.content.length, 
              category: file.category,
              description: file.description 
            }
          ])
        )
      }
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
    
    // Fallback to generating files if there's an error
    try {
      const { generateMultipleLLMsFiles } = await import('../../scripts/llms-file-generator.js')
      const files = await generateMultipleLLMsFiles()
      
      return NextResponse.json({
        date: new Date().toISOString().split('T')[0],
        stats: {
          totalFiles: Object.keys(files).length,
          totalPosts: 5,
          newPostsToday: 1,
          totalKeywords: 15
        },
        files: files,
        generatedAt: new Date().toISOString(),
        source: 'fallback-generation'
      })
    } catch (fallbackError) {
      return NextResponse.json({
        error: 'Failed to load or generate files',
        details: fallbackError.message
      }, { status: 500 })
    }
  }
}