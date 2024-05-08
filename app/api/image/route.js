import sharp from 'sharp'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const formData = await request.formData()
        const image = formData.get('image')
        const conversionType = formData.get('conversionType')
        const quality = formData.get('quality')
        const width = formData.get('width')
        const height = formData.get('height')

        if (!image) {
            return new NextResponse('No file uploaded.', { status: 400 })
        }

        const buffer = Buffer.from(await image.arrayBuffer())
        const originalFilename = image.name

        let transform = sharp(buffer)

        const parsedWidth = width ? parseInt(width) : null
        const parsedHeight = height ? parseInt(height) : null
        if (parsedWidth || parsedHeight) {
            transform = transform.resize({
                width: parsedWidth || null,
                height: parsedHeight || null,
                fit: 'inside',
                withoutEnlargement: true
            })
        }

        const parsedQuality = quality ? parseInt(quality) : 100

        switch (conversionType) {
            case 'png':
                transform = transform.png({ quality: parsedQuality })
                break
            case 'jpeg':
            case 'jpg':
                transform = transform.jpeg({ quality: parsedQuality })
                break
            case 'webp':
                transform = transform.webp({ quality: parsedQuality })
                break
            case 'avif':
                transform = transform.avif({ quality: parsedQuality })
                break
            case 'tiff':
                transform = transform.tiff({ quality: parsedQuality })
                break
            case 'gif':
                transform = transform.gif()
                break
            default:
                return new NextResponse('Invalid conversion type.', { status: 400 })
