const express = require('express')
const app = express()
const port = 7000
const userRoute = require('./routes/userRoute')

const path = require('path');


app.set('views',path.join(__dirname,'views'))
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname,'public')));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/',userRoute)

app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))