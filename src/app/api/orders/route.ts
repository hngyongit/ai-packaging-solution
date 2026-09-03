import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Under development' }, { status: 501 })
}

export async function POST() {
  return NextResponse.json({ message: 'Under development' }, { status: 501 })
}