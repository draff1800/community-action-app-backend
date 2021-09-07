const express = require('express');
const path = require('path');
const port = process.env.PORT || 8080;
var app = express();
const bodyParser = require('body-parser');

app.use(express.static(__dirname));

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

require('./db/routes.js')(app);

app.get('*', (req, res) => {
});

app.listen(port);
console.log('server started');
