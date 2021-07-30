const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('express-jwt');

const { login, clients, policies } = require('./routers');
const assert = require('../helpers/assert');
const storage = require('../helpers/storage');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

app.use((req, res, next) => {
	res.storage = storage;
	req.assert = assert;
	next();
});

app.use(jwt({
	secret: process.env.SECRET,
	algorithms: ['HS256'],
	getToken: function fromHeaderOrQuerystring(req) {
		if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
			return req.headers.authorization.split(' ')[1];
		} if (req.query && req.query.token) {
			return req.query.token;
		}
		return null;
	},
}).unless({ path: ['/api/v1/login'] }));

app.use('/api/v1/login', login);
app.use('/api/v1/clients', clients);
app.use('/api/v1/policies', policies);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
	let code = err.code || 500;
	code = ['credentials_required', 'invalid_token'].indexOf(err.code) !== -1 ? 401 : code;
	res.status(code).send({ message: err.message, code });
});

const port = process.env.PORT || 3000;
module.exports = new Promise((resolve, reject) => {
	const listener = app.listen(port, () => {
		// eslint-disable-next-line no-console
		console.log(`server is ready on 0.0.0.0:${port}`);
		resolve({ app, listener, port });
	}).on('error', (err) => reject(err));
});
