import {  NextResponse } from 'next/server';

// Simple test endpoint to verify API functionality
export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      nodeEnv: process.env.NODE_ENV || 'not set',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      corsOrigin: process.env.CORS_ORIGIN || 'not set',
      timestamp: new Date().toISOString()
    };

    console.log('Test API: Environment check:', envCheck);
    
    return NextResponse.json(
      { 
        status: 'success',
        message: 'API test endpoint is working',
        environment: envCheck
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    console.error('Test API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Test endpoint error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
