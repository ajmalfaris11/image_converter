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
        const preserveMetadata = formData.get('preserveMetadata') === 'true'
        const metaAuthor = formData.get('metaAuthor') as string | null
        const metaCopyright = formData.get('metaCopyright') as string | null
        const metaTitle = formData.get('metaTitle') as string | null
        const metaSoftware = formData.get('metaSoftware') as string | null
        const metaMake = formData.get('metaMake') as string | null
        const metaLocation = formData.get('metaLocation') as string | null

        const cropXStr = formData.get('cropX') as string | null
        const cropYStr = formData.get('cropY') as string | null
        const cropWStr = formData.get('cropWidth') as string | null
        const cropHStr = formData.get('cropHeight') as string | null
        const rotationStr = formData.get('rotation') as string | null

        if (!image) {
            return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
        }

        const buffer = Buffer.from(await image.arrayBuffer())
        let sharpInstance = sharp(buffer)
        
        if (preserveMetadata) {
            const metadataOptions: any = {}
            if (metaAuthor || metaCopyright || metaTitle || metaSoftware || metaMake || metaLocation) {
                metadataOptions.exif = { IFD0: {} }
                
                // Mandatory TIFF tags for valid EXIF
                metadataOptions.exif.IFD0.XResolution = 72
                metadataOptions.exif.IFD0.YResolution = 72
                metadataOptions.exif.IFD0.ResolutionUnit = 2 // inches

                if (metaAuthor) metadataOptions.exif.IFD0.Artist = metaAuthor
                if (metaCopyright) metadataOptions.exif.IFD0.Copyright = metaCopyright
                if (metaTitle) metadataOptions.exif.IFD0.ImageDescription = metaTitle
                if (metaSoftware) metadataOptions.exif.IFD0.Software = metaSoftware
                if (metaMake) metadataOptions.exif.IFD0.Make = metaMake
                
                if (metaLocation) {
                    const coords = metaLocation.split(',').map(s => parseFloat(s.trim()));
                    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                        const decimalToExifGps = (decimal: number) => {
                            const absolute = Math.abs(decimal);
                            const degrees = Math.floor(absolute);
                            const minutesNotTruncated = (absolute - degrees) * 60;
                            const minutes = Math.floor(minutesNotTruncated);
                            const seconds = Math.floor((minutesNotTruncated - minutes) * 60 * 100);
                            return `${degrees}/1, ${minutes}/1, ${seconds}/100`;
                        };
                        metadataOptions.exif.IFD3 = {
                            GPSLatitudeRef: coords[0] >= 0 ? 'N' : 'S',
                            GPSLatitude: decimalToExifGps(coords[0]),
                            GPSLongitudeRef: coords[1] >= 0 ? 'E' : 'W',
                            GPSLongitude: decimalToExifGps(coords[1])
                        };
                    }
                }
            }
            sharpInstance = sharpInstance.withMetadata(metadataOptions)
        }

        if (rotationStr) {
            const rotation = parseFloat(rotationStr)
            if (rotation !== 0) {
                sharpInstance = sharpInstance.rotate(rotation)
            }
        }

        if (cropXStr && cropYStr && cropWStr && cropHStr) {
            sharpInstance = sharpInstance.extract({
                left: Math.round(parseFloat(cropXStr)),
                top: Math.round(parseFloat(cropYStr)),
                width: Math.round(parseFloat(cropWStr)),
                height: Math.round(parseFloat(cropHStr))
            })
        }

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

        return new NextResponse(outputBuffer as any, {
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
