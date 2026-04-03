import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_INTERNAL_URL || 'http://localhost:3001';

async function handler(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const search = request.nextUrl.search;
  const url = `${API_URL}/api${path}${search}`;

  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  if (authorization) {
    headers.set('authorization', authorization);
  }
  headers.set('content-type', 'application/json');

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined;

  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
  });

  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const PUT = handler;
