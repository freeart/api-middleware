const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
	let { limit = 10, page = 0 } = req.query;
	limit = parseInt(limit, 10);
	page = parseInt(page, 10);
	req.assert(limit, { type: 'number', message: 'Invalid limit', code: 400 });
	req.assert(page, { type: 'number', message: 'Invalid page', code: 400 });

	const filter = req.user.role !== 'admin' ? { filter: (item) => item.clientId === req.user.id } : {};

	res.storage.query('policies', filter, { limit, page }, (err, result) => {
		if (err) {
			next(err);
			return;
		}
		res.send(result);
	});
});

router.get('/:id', (req, res, next) => {
	const { id = null } = req.params;
	req.assert(id, { type: 'string', message: 'Invalid policy id', code: 400 });

	const params = { id };
	if (req.user.role !== 'admin') {
		params.condition = (record) => record.clientId === req.user.id;
	}

	res.storage.get('policies', params, (err, result) => {
		if (err) {
			next(err);
			return;
		}
		res.send(result);
	});
});

module.exports = router;
