
const sharp = require('sharp');


const loadPage = async(req,res)=>{
    try {
        res.render('index')
