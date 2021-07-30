const express = require('express');
const jwt = require('jsonwebtoken');
const { HttpError } = require('../../helpers/error');

const router = express.Router();

router.post('/', (req, res, next) => {
	const { username = null, password = null } = req.body;
	req.assert(username, { type: 'string', message: 'username is empty', code: 400 });
	req.assert(password, { type: 'string', message: 'password is empty', code: 400 });
	res.storage.query('clients', { filter: (item) => item.email === username && password === 's3cr3t' }, {},
		(err, result) => {
			if (err) {
				next(err);
				return;
			}
			if (result.length !== 1) {
				next(new HttpError('Wrong credentials', 401));
				return;
			}
			const token = jwt.sign({
				id: result[0].id,
				role: result[0].role,
			}, process.env.SECRET, { expiresIn: 60 * 60 });
			res.send({
				type: 'Bearer',
				token,
			});
		});
});

module.exports = router;
