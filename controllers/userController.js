
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
