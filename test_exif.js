const sharp = require('sharp');

async function test() {
    const imgBuffer = await sharp({
        create: {
            width: 100,
            height: 100,
            channels: 3,
            background: { r: 255, g: 0, b: 0 }
        }
    }).png().toBuffer();

    const metadataOptions = {
        exif: {
            IFD0: {
                Artist: 'Test Artist',
                Software: 'Test Software'
            }
        }
    };

    const outBufferPng = await sharp(imgBuffer)
        .withMetadata(metadataOptions)
        .png()
        .toBuffer();

    const outBufferJpeg = await sharp(imgBuffer)
        .withMetadata(metadataOptions)
        .jpeg()
        .toBuffer();

    const pngMeta = await sharp(outBufferPng).metadata();
    const jpegMeta = await sharp(outBufferJpeg).metadata();

    console.log("PNG EXIF Buffer string:", pngMeta.exif ? pngMeta.exif.toString() : "NONE");
    console.log("JPEG EXIF Buffer string:", jpegMeta.exif ? jpegMeta.exif.toString() : "NONE");
}

test().catch(console.error);
