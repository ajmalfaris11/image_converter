
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
        const {conversionType} = req.body
        console.log(conversionType);
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Get the original filename
        const originalFilename = req.file.originalname;

        // Extract the file extension from the original filename
        const fileExtension = originalFilename.split('.').pop().toLowerCase();

        // Convert the image to JPG format using sharp
        let convertedImage  

        if (conversionType == 'png') {
            convertedImage = await sharp(req.file.buffer).png().toBuffer();
        } else if (conversionType == 'jpg') {
            convertedImage = await sharp(req.file.buffer).jpeg().toBuffer();
        }

        // Set the filename for the converted image based on the original filename
        const convertedFilename = `converted_${originalFilename.replace(/\.[^/.]+$/, '')}.jpg`;

        // Send the converted image as a downloadable attachment with the new filename
        res.set('Content-Type', 'image/jpeg');
        res.set('Content-Disposition', `attachment; filename=${convertedFilename}`);
        res.send(convertedImage);
    } catch (error) {
        console.log(error.message); 
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadPage,
    imagePng,
}