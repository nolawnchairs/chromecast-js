const express = require('express')
const path = require('path')
const process = require('process')
const app = express()
const port = process.env.PORT || 9000

app.use('/static', express.static(path.join(__dirname, './static')))
app.use('/i', (req, res) => {
  res.sendFile(path.join(__dirname, './static/index.html'))
})
app.listen(port, () => console.log('Listening on port '+ port))

