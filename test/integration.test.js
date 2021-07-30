/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const { expect } = require('chai');
const { DateTime } = require('luxon');
const { get } = require('../src/helpers/axios');

describe('intergation test', () => {
	describe('GET /clients', () => {
		it('should return a list of clients', (done) => {
			get('clients')
				.then(({ data, expires }) => {
					expect(DateTime.now() + 60 < expires).to.be.true;
					expect(data).to.be.a('array');
					expect(data).to.have.lengthOf.above(1);
					data.forEach((client) => {
						expect(client).to.have.all.keys('id', 'name', 'email', 'role');
						expect(client.id).to.be.a('string');
						expect(client.name).to.be.a('string');
						expect(client.email).to.be.a('string');
						expect(client.role).to.be.a('string');
					});
					expect(data.filter((client) => client.role === 'admin')).to.have.lengthOf.above(0);
					expect(data.filter((client) => client.role === 'user')).to.have.lengthOf.above(0);

					done();
				})
				.catch((err) => done(err));
		});
	});

	describe('GET /policies', () => {
		it('should return a list of policies', (done) => {
			get('policies')
				.then(({ data, expires }) => {
					expect(DateTime.now() + 60 < expires).to.be.true;
					expect(data).to.be.a('array');
					expect(data).to.have.lengthOf.above(1);
					data.forEach((client) => {
						expect(client).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
						expect(client.id).to.be.a('string');
						expect(client.amountInsured).to.be.a('string');
						expect(client.email).to.be.a('string');
						expect(client.inceptionDate).to.be.a('string');
						expect(client.installmentPayment).to.be.a('boolean');
						expect(client.clientId).to.be.a('string');
					});
					done();
				})
				.catch((err) => done(err));
		});
	});
});
