/* eslint-disable no-undef */
const { expect } = require('chai');
const assert = require('../src/helpers/assert');

describe('unit test', () => {
	describe('assert number type', () => {
		it('number should be no errors', () => {
			expect(assert.bind(assert, 10, { type: 'number' })).to.not.throw();
		});

		it('number as a string throw an error', () => {
			expect(assert.bind(assert, '10', { type: 'number' })).to.throw();
		});

		it('string should throw an error', () => {
			expect(assert.bind(assert, 'test', { type: 'number' })).to.throw('test');
		});
	});

	describe('assert string type', () => {
		it('number should throw an error', () => {
			expect(assert.bind(assert, 10, { type: 'string' })).to.throw();
		});

		it('number as a string should be no errors', () => {
			expect(assert.bind(assert, '10', { type: 'string' })).to.not.throw();
		});

		it('string should be no errors', () => {
			expect(assert.bind(assert, 'test', { type: 'string' })).to.not.throw();
		});
	});

	describe('assert boolean type', () => {
		it('boolean false should throw an error', () => {
			expect(assert.bind(assert, false, { type: 'boolean' })).to.throw();
		});

		it('boolean true should be no errors', () => {
			expect(assert.bind(assert, true, { type: 'boolean' })).to.not.throw();
		});

		it('number should throw an error', () => {
			expect(assert.bind(assert, 1, { type: 'boolean' })).to.throw();
		});

		it('number as a string should throw an error', () => {
			expect(assert.bind(assert, '1', { type: 'boolean' })).to.throw();
		});

		it('boolean as a string should throw an error', () => {
			expect(assert.bind(assert, 'true', { type: 'boolean' })).to.throw();
		});
	});

	describe('assert wrong type', () => {
		it('object should throw an error', () => {
			expect(assert.bind(assert, {}, { type: 'object' })).to.throw();
		});
	});
});
