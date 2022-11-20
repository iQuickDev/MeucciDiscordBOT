const express = require('express')
const jwt = require('jsonwebtoken')

const port = 6969

const app = express()
app.use(express.static(`${__dirname}/public`))
app.use(express.json())

app.post('/api/login', (req, res) => {
	res.status(200)
	const credential = req.body.credential
	console.log(jwt.decode(credential))
})

app.listen(port)