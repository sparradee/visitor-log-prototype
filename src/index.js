const app = require('express')()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const api = require('./api')

app.use(bodyParser.json())

mongoose.set('debug', true)

// Connect to database
mongoose
  .connect(
    'mongodb+srv://adminUser:***@cluster0.2jcll.mongodb.net/userAccess?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .catch((err) => {
    console.error('mongoose connection error', err)
  })

mongoose.connection.on('error', (err) => {
  console.error('mongoose connection error', err)
})

// Start up the webserver
app.listen(8080)
app.use(api)

/**
 * Load the default homepage.
 */
app.get('/', (req, res) => res.status(200).sendFile(`${__dirname}/html/index.html`))
