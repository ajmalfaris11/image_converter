
const sharp = require('sharp');


const loadPage = async(req,res)=>{
    try {
        res.render('index')
    } catch (error) {
        console.log(error.message);
    }
}


const imagePng = async(req,res)=>{
    try {
        const { conversionType, quality, width, height } = req.body;
        console.log("Conversion Settings:", { conversionType, quality, width, height });

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Get the original filename
        const originalFilename = req.file.originalname;

        // Initialize sharp pipeline
        let transform = sharp(req.file.buffer);

        // Apply resize if provided
        const parsedWidth = width ? parseInt(width) : null;
        const parsedHeight = height ? parseInt(height) : null;
        if (parsedWidth || parsedHeight) {
            transform = transform.resize({
                width: parsedWidth || null,
                height: parsedHeight || null,
                fit: 'inside', // Preserve aspect ratio, don't crop
                withoutEnlargement: true // Don't scale up small images unnecessarily
            });
        }

        // Parse quality (default 100)
        const parsedQuality = quality ? parseInt(quality) : 100;

        // Apply format and quality
        switch (conversionType) {
            case 'png':
                // PNG handles quality differently but setting effort/compression
                transform = transform.png({ quality: parsedQuality });
                break;
            case 'jpeg':
            case 'jpg':
                transform = transform.jpeg({ quality: parsedQuality });
                break;
            case 'webp':
                transform = transform.webp({ quality: parsedQuality });
                break;
            case 'avif':
                transform = transform.avif({ quality: parsedQuality });
                break;
            case 'tiff':
                transform = transform.tiff({ quality: parsedQuality });
                break;
            case 'gif':
                // Sharp supports GIF creation in recent versions
                transform = transform.gif();
                break;
            default:
                return res.status(400).send('Invalid conversion type.');
        }

        const convertedImage = await transform.toBuffer();

        // Ensure extension corresponds to conversion type
        const ext = conversionType === 'jpeg' ? 'jpg' : conversionType;
        const convertedFilename = `converted_${originalFilename.replace(/\.[^/.]+$/, '')}.${ext}`;

        // Send the converted image as a downloadable attachment
        // We set appropriate content type dynamically
        let contentType = `image/${ext}`;
        if (ext === 'jpg') contentType = 'image/jpeg';
        
        res.set('Content-Type', contentType);
        res.set('Content-Disposition', `attachment; filename="${convertedFilename}"`);
        res.send(convertedImage);
    } catch (error) {
        console.error("Conversion Error:", error.message); 
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadPage,
    imagePng,
}