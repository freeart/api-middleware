const { DateTime } = require('luxon');
const { get } = require('./axios');
const { HttpError } = require('../helpers/error');

class Storage {
	static cache = {
		clients: {
			expires: null,
			data: [],
			index: {},
			etag: null,
			date: null,
		},
		policies: {
			expires: null,
			data: [],
			index: {},
			etag: null,
			date: null,
		},
	};

	static queue = {
		clients: [],
		policies: [],
	};

	static running = {
		clients: false,
		policies: false,
	};

	static async addTask(entity, task) {
		Storage.queue[entity].push(task);

		if (Storage.running[entity]) return;

		Storage.running[entity] = true;

		if (DateTime.now() >= Storage.cache[entity].expires) {
			const result = await get(entity, { etag: Storage.cache[entity].etag, date: Storage.cache[entity].date });
			if (Storage.cache[entity].etag !== result.etag){
				const index = result.data.reduce((acc, cur) => {
					acc[cur.id] = cur;
					return acc;
				}, {})
				Storage.cache[entity] = {
					expires: result.expires,
					data: result.data,
					etag: result.etag,
					date: result.date,
					index,
				};
			}
		}

		while (Storage.queue[entity].length) {
			const task = Storage.queue[entity].shift();
			await task();
		}

		Storage.running[entity] = false;
	}

	static getById(entity, id, condition) {
		const record = Storage.cache[entity].index[id];
		if (!record) {
			throw new HttpError(`Record#id = ${id} not found`, 404);
		} else if (record && typeof condition === 'function' && !condition(record)) {
			throw new HttpError('Access Denied', 403);
		}

		return Storage.cache[entity].index[id];
	}

	static listByFilter(entity, filter, limit, page) {
		let data = Storage.cache[entity].data;
		if (typeof filter === 'function') {
			data = data.filter(filter);
		}
		if (typeof limit === 'number' && typeof page === 'number') {
			data = data.slice(page * limit, (page + 1) * limit);
		}
		return data;
	}

	static async query(entity, { filter }, { limit, page }, cb) {
		const task = () => {
			try{
				const result = Storage.listByFilter(entity, filter, limit, page);
				cb(null, result);
			} catch(e){
				cb(e);
			}
		}
		try{
			await Storage.addTask(entity, task);
		}
		catch(e){
			cb(e);
		}
	}

	static async get(entity, { id, condition }, cb) {
		const task = () => {
			try{
				const result = Storage.getById(entity, id, condition);
				cb(null, result);
			} catch(e){
				cb(e);
			}
		}
		try{
			await Storage.addTask(entity, task);
		}
		catch(e){
			cb(e);
		}
	}
}

module.exports = {
	query: Storage.query,
	get: Storage.get,
};
