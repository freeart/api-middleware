const { HttpError } = require('./error');

module.exports = (rule, { type = 'number', message = `value '${rule}' should be a '${type}'`, code = 500 }) => {
	let errorMessage;
	const optional = type.indexOf('?') !== -1;
	if (optional) {
		// eslint-disable-next-line no-param-reassign
		type = type.replace(/\?/g, '');
	}
	switch (type) {
	case 'number': {
		if (typeof rule !== 'number' || Number.isNaN(rule)) errorMessage = message;
		break;
	}
	case 'string': {
		if (typeof rule !== 'string' || !rule.trim().length) errorMessage = message;
		break;
	}
	case 'boolean': {
		if (typeof rule !== 'boolean' || (typeof rule === 'boolean' && rule === false)) errorMessage = message;
		break;
	}
	default:
		errorMessage = 'Unknown type';
	}
	if (optional && errorMessage && (rule === null || rule === undefined)) return;

	if (errorMessage) {
		throw new HttpError(errorMessage, code);
	}
};
