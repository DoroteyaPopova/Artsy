const express = require('express');
const productRoutes = require('./routes/products.routes.js')


const { PORT } = require('./constants');
const initDatabase = require('./config/mongooseConfig');

const app = express();

//* middleare
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

//* routes
app.use('/test/products', productRoutes)


app.get('/', (req, res) => {
    res.send('Hello from Node API!')
});

initDatabase()
    .then(() => {
        app.listen(PORT, () => console.log(`Server is running on port http://localhost:${PORT}....`));
    })
    .catch((err) => {
        console.log('Connot connect database:', err);
    })


// mongoose.connect("mongodb://localhost:27017/")
//     .then(() => {
//         console.log("Connected to database!");
//     }).catch(() => {
//         console.log("Connection failed!...");
//     });
