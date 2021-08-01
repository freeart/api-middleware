const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
	let { limit = 10, page = 0 } = req.query;
	const { name = null } = req.query;
	limit = parseInt(limit, 10);
	page = parseInt(page, 10);
	req.assert(limit, { type: 'number', message: 'Invalid limit', code: 400 });
	req.assert(page, { type: 'number', message: 'Invalid page', code: 400 });
	req.assert(name, { type: 'string?', message: 'Invalid name filter', code: 400 });

	let filter = req.user.role === 'admin' && name ? { filter: (item) => item.name === name } : {};
	if (req.user.role !== 'admin') {
		if (name) {
			filter = { filter: (item) => item.id === req.user.id && item.name === name };
		} else {
			filter = { filter: (item) => item.id === req.user.id };
		}
	}
	res.storage.query('clients', filter, { limit, page }, (err, result) => {
		if (err) {
			res.status(500).send({ message: err.message, code: 500 });
			return;
		}
		res.send(result);
	});
});

router.get('/:id', (req, res, next) => {
	const { id = null } = req.params;
	req.assert(id, { type: 'string', message: 'Invalid client id', code: 400 });
	if (req.user.role !== 'admin') {
		req.assert(id === req.user.id, { type: 'boolean', message: 'Access Denied', code: 403 });
	}

	res.storage.get('clients', { id }, (err, result) => {
		if (err) {
			next(err);
			return;
		}
		res.send(result);
	});
});

router.get('/:id/policies', (req, res, next) => {
	const { id: clientId = null } = req.params;
	req.assert(clientId, { type: 'string', message: 'Invalid client id', code: 400 });

	let filter = req.user.role === 'admin' ? { filter: (item) => item.clientId === clientId } : {};
	if (req.user.role !== 'admin') {
		filter = { filter: (item) => item.clientId === req.user.id };
	}
	res.storage.query('policies', filter, {}, (err, result) => {
		if (err) {
			next(err);
			return;
		}
		res.send(result);
	});
});

module.exports = router;
