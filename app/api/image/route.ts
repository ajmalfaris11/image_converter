import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const image = formData.get('image') as File | null
        const conversionType = formData.get('conversionType') as string
        const qualityStr = formData.get('quality') as string | null
        const widthStr = formData.get('width') as string | null
        const heightStr = formData.get('height') as string | null

        if (!image) {
            return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
        }

        const buffer = Buffer.from(await image.arrayBuffer())
        let sharpInstance = sharp(buffer)

        // Handle resizing if width or height are provided
        if (widthStr || heightStr) {
            const width = widthStr ? parseInt(widthStr, 10) : undefined
            const height = heightStr ? parseInt(heightStr, 10) : undefined
            sharpInstance = sharpInstance.resize({
                width,
                height,
                fit: 'inside',
                withoutEnlargement: true
            })
        }

        const quality = qualityStr ? parseInt(qualityStr, 10) : 90
        let outputBuffer: Buffer

        switch (conversionType) {
            case 'png':
                outputBuffer = await sharpInstance.png({ quality }).toBuffer()
                break
            case 'webp':
                outputBuffer = await sharpInstance.webp({ quality }).toBuffer()
                break
            case 'avif':
                outputBuffer = await sharpInstance.avif({ quality }).toBuffer()
                break
            case 'tiff':
                outputBuffer = await sharpInstance.tiff({ quality }).toBuffer()
                break
            case 'gif':
                outputBuffer = await sharpInstance.gif().toBuffer()
                break
            case 'jpg':
            case 'jpeg':
            default:
                outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer()
                break
        }

        const contentType = conversionType === 'jpg' ? 'image/jpeg' : `image/${conversionType}`

        return new NextResponse(outputBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="converted_image.${conversionType === 'jpeg' ? 'jpg' : conversionType}"`
            }
        })

    } catch (error) {
        console.error('Error processing image:', error)
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
    }
}
