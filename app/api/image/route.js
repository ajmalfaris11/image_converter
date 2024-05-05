import sharp from 'sharp'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const formData = await request.formData()
        const image = formData.get('image')
