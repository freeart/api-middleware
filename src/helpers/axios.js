const { DateTime } = require('luxon');
const axios = require('axios').default;
const jwtDecode = require('jwt-decode');

const base = 'https://dare-nodejs-assessment.herokuapp.com';

let cache;

module.exports = {
	get: async (entity, options = {}) => {
		const { etag = null, date = null } = options;
		if (!cache || (DateTime.now() + 60) <= cache.expires) {
			const raw = await axios({
				method: 'post',
				url: `${base}/api/login`,
				data: {
					client_id: 'dare',
					client_secret: 's3cr3t',
				},
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json',
				},
			});
			const decoded = jwtDecode(raw.data.token);
			cache = {
				token: `${raw.data.type} ${raw.data.token}`,
				expires: DateTime.fromSeconds(decoded.exp),
			};
		}
		const headers = {
			authorization: cache.token,
		};
		if (etag) {
			headers['If-None-Match'] = `"${etag}"`;
		}

		if (date) {
			headers['If-Modified-Since'] = date;
		}

		try {
			const result = await axios({
				method: 'get',
				url: `${base}/api/${entity}`,
				headers,
			});

			return {
				expires: DateTime.fromRFC2822(result.headers.expires),
				etag: result.headers.etag,
				data: result.data,
				date: result.headers.date,
			};
		} catch (e) {
			return null;
		}
	},
};
