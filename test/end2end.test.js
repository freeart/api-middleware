/* eslint-disable no-param-reassign */
/* eslint-disable global-require */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const { expect, request } = require('chai');
const { get } = require('../src/helpers/axios');

const cache = {
	users: null,
	policies: null,
	server: null,
	user: null,
	admin: null,
};

describe('E2E test', () => {
	before((done) => {
		const app = require('../src/api');
		app.then(({ listener, port }) => {
			cache.server = listener;
			process.env.ENTRY_POINT = `http://127.0.0.1:${port}`;
			Promise.all([
				get('policies').then(({ data }) => {
					cache.policies = data;
				}),
				get('clients').then(({ data }) => {
					cache.users = data;
				}),
			])
				.then(() => {
					const index = cache.users.reduce((acc, cur) => {
						acc[cur.id] = cur;
						return acc;
					}, {});
					cache.policies = cache.policies.map((policy) => ({
						...policy,
						client: index[policy.clientId],
					}));
					done();
				})
				.catch((err) => done(err));
		}).catch((err) => done(err));
	});

	after(() => {
		expect(cache.server).to.be.not.null;
		cache.server.close();
	});

	describe('no token scope', () => {
		it('get /clients', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients')
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(401);
					expect(res.body).to.be.deep.equal({
						message: 'No authorization token was found',
						code: 401,
					});
					done();
				});
		});

		it('get /clients/test-test-test', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients/test-test-test')
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(401);
					expect(res.body).to.be.deep.equal({
						message: 'No authorization token was found',
						code: 401,
					});
					done();
				});
		});

		it('get /clients/test-test-test/policies', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients/test-test-test/policies')
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(401);
					expect(res.body).to.be.deep.equal({
						message: 'No authorization token was found',
						code: 401,
					});
					done();
				});
		});

		it('get /policies', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/policies')
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(401);
					expect(res.body).to.be.deep.equal({
						message: 'No authorization token was found',
						code: 401,
					});
					done();
				});
		});

		it('get /policies/test-test-test', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/policies/test-test-test')
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(401);
					expect(res.body).to.be.deep.equal({
						message: 'No authorization token was found',
						code: 401,
					});
					done();
				});
		});
	});

	describe('admin token scope', () => {
		it('accounts should be more or equal 20', (done) => {
			expect(cache.users).to.have.lengthOf.greaterThanOrEqual(20);

			done();
		});

		it('find admin account from integration api ', (done) => {
			cache.admin = cache.users.find((client) => client.role === 'admin');
			expect(cache.admin.email).to.be.a('string');

			done();
		});

		it('get token', (done) => {
			request(process.env.ENTRY_POINT)
				.post('/api/v1/login')
				.send({
					username: cache.admin.email,
					password: 's3cr3t',
				})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					cache.admin.token = `${res.body.type} ${res.body.token}`;
					done();
				});
		});

		it('get /clients', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients')
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(10);
					res.body.forEach((client) => {
						expect(client).to.have.all.keys('id', 'name', 'email', 'role');
						expect(client.id).to.be.a('string');
						expect(client.name).to.be.a('string');
						expect(client.email).to.be.a('string');
						expect(client.role).to.be.a('string');
					});
					done();
				});
		});

		it('get /clients?limit=20', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients?limit=20')
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(20);
					res.body.forEach((client) => {
						expect(client).to.have.all.keys('id', 'name', 'email', 'role');
						expect(client.id).to.be.a('string');
						expect(client.name).to.be.a('string');
						expect(client.email).to.be.a('string');
						expect(client.role).to.be.a('string');
					});
					done();
				});
		});

		it('get /clients?limit=<clients.length - 1>&page=1', (done) => {
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/clients?limit=${cache.users.length - 1}&page=1`)
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(1);
					res.body.forEach((client) => {
						expect(client).to.have.all.keys('id', 'name', 'email', 'role');
						expect(client.id).to.be.a('string');
						expect(client.name).to.be.a('string');
						expect(client.email).to.be.a('string');
						expect(client.role).to.be.a('string');
					});
					done();
				});
		});

		it('get /clients?name=<user_name>', (done) => {
			const randomUser = cache.users.find((client) => client.role === 'user');
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/clients?name=${randomUser.name}`)
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf.greaterThanOrEqual(1);
					res.body.forEach((client) => {
						expect(client).to.have.all.keys('id', 'name', 'email', 'role');
						expect(client.id).to.be.a('string');
						expect(client.name).to.be.a('string');
						expect(client.email).to.be.a('string');
						expect(client.role).to.be.a('string');
						expect(client.name).to.be.equal(randomUser.name);
					});
					done();
				});
		});

		it('get /clients/<user_id>', (done) => {
			const randomUser = cache.users.find((client) => client.role === 'user');
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/clients/${randomUser.id}`)
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('object');
					const client = res.body;
					expect(client).to.have.all.keys('id', 'name', 'email', 'role');
					expect(client.id).to.be.a('string');
					expect(client.name).to.be.a('string');
					expect(client.email).to.be.a('string');
					expect(client.role).to.be.a('string');
					expect(client.id).equal(randomUser.id);
					done();
				});
		});

		it('get /clients/<user_id>/policies', (done) => {
			const randomPolicy = cache.policies[0];
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/clients/${randomPolicy.clientId}/policies`)
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('array');
					const counter = cache.policies
						.filter((policy) => policy.clientId === randomPolicy.clientId).length;
					expect(res.body).to.have.lengthOf(counter);
					res.body.forEach((policy) => {
						expect(policy).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
						expect(policy.id).to.be.a('string');
						expect(policy.amountInsured).to.be.a('string');
						expect(policy.email).to.be.a('string');
						expect(policy.inceptionDate).to.be.a('string');
						expect(policy.installmentPayment).to.be.a('boolean');
						expect(policy.clientId).to.be.a('string');
					});
					done();
				});
		});

		it('get /policies', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/policies')
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(10);
					res.body.forEach((policy) => {
						expect(policy).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
						expect(policy.id).to.be.a('string');
						expect(policy.amountInsured).to.be.a('string');
						expect(policy.email).to.be.a('string');
						expect(policy.inceptionDate).to.be.a('string');
						expect(policy.installmentPayment).to.be.a('boolean');
						expect(policy.clientId).to.be.a('string');
					});
					done();
				});
		});

		it('get /policies?limit=20', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/policies?limit=20')
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(20);
					res.body.forEach((policy) => {
						expect(policy).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
						expect(policy.id).to.be.a('string');
						expect(policy.amountInsured).to.be.a('string');
						expect(policy.email).to.be.a('string');
						expect(policy.inceptionDate).to.be.a('string');
						expect(policy.installmentPayment).to.be.a('boolean');
						expect(policy.clientId).to.be.a('string');
					});
					done();
				});
		});

		it('get /policies?limit=<policies.length - 1>&page=1', (done) => {
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/policies?limit=${cache.policies.length - 1}&page=1`)
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(1);
					res.body.forEach((policy) => {
						expect(policy).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
						expect(policy.id).to.be.a('string');
						expect(policy.amountInsured).to.be.a('string');
						expect(policy.email).to.be.a('string');
						expect(policy.inceptionDate).to.be.a('string');
						expect(policy.installmentPayment).to.be.a('boolean');
						expect(policy.clientId).to.be.a('string');
					});
					done();
				});
		});

		it('get /policies?limit=AAA', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/policies?limit=AAA')
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(400);
					expect(res.body).to.be.deep.equal({
						message: 'Invalid limit',
						code: 400,
					});
					done();
				});
		});

		it('get /policies/<policy_id>', (done) => {
			const randomPolicy = cache.policies.find((policy) => policy.clientId !== cache.admin.id);
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/policies/${randomPolicy.id}`)
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('object');
					const policy = res.body;
					expect(policy).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
					expect(policy.id).to.be.a('string');
					expect(policy.amountInsured).to.be.a('string');
					expect(policy.email).to.be.a('string');
					expect(policy.inceptionDate).to.be.a('string');
					expect(policy.installmentPayment).to.be.a('boolean');
					expect(policy.clientId).to.be.a('string');
					expect(policy.id).to.be.equal(randomPolicy.id);
					done();
				});
		});

		it('get /policies/test-test-test', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/policies/test-test-test')
				.set('authorization', cache.admin.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(404);
					expect(res.body).to.be.deep.equal({
						message: 'Record#id = test-test-test not found',
						code: 404,
					});
					done();
				});
		});
	});

	describe('user token scope', () => {
		it('find user account from integration api', (done) => {
			cache.user = cache.users.find((user) => user.role === 'user');
			expect(cache.user.email).to.be.a('string');

			cache.user.policies = cache.policies.filter((policy) => policy.clientId === cache.user.id);

			done();
		});

		it('get token', (done) => {
			request(process.env.ENTRY_POINT)
				.post('/api/v1/login')
				.send({
					username: cache.user.email,
					password: 's3cr3t',
				})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					cache.user.token = `${res.body.type} ${res.body.token}`;
					done();
				});
		});

		it('get /clients', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients')
				.set('authorization', cache.user.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(1);
					const client = res.body[0];
					expect(client).to.have.all.keys('id', 'name', 'email', 'role');
					expect(client.id).to.be.a('string');
					expect(client.name).to.be.a('string');
					expect(client.email).to.be.a('string');
					expect(client.role).to.be.a('string');
					expect(client.id).equal(cache.user.id);
					done();
				});
		});

		it('get /clients (filtered by name)', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients?name=test')
				.set('authorization', cache.user.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.be.empty;
					expect(res.body).to.be.an('array');
					done();
				});
		});

		it('get /clients/test-test-test', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/clients/test-test-test')
				.set('authorization', cache.user.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(403);
					expect(res.body).to.be.deep.equal({
						message: 'Access Denied',
						code: 403,
					});
					done();
				});
		});

		it('get /clients/<self_id>', (done) => {
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/clients/${cache.user.id}`)
				.set('authorization', cache.user.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.not.be.empty;
					expect(res.body).to.be.an('object');
					const client = res.body;
					expect(client).to.have.all.keys('id', 'name', 'email', 'role');
					expect(client.id).to.be.a('string');
					expect(client.name).to.be.a('string');
					expect(client.email).to.be.a('string');
					expect(client.role).to.be.a('string');
					expect(client.id).equal(cache.user.id);
					done();
				});
		});

		it('get /clients/<self_id>/policies', (done) => {
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/clients/${cache.user.id}/policies`)
				.set('authorization', cache.user.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(cache.user.policies.length);
					res.body.forEach((policy) => {
						expect(policy).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
						expect(policy.id).to.be.a('string');
						expect(policy.amountInsured).to.be.a('string');
						expect(policy.email).to.be.a('string');
						expect(policy.inceptionDate).to.be.a('string');
						expect(policy.installmentPayment).to.be.a('boolean');
						expect(policy.clientId).to.be.a('string');
					});
					done();
				});
		});

		it('get /policies', (done) => {
			request(process.env.ENTRY_POINT)
				.get('/api/v1/policies')
				.set('authorization', cache.user.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.lengthOf(cache.user.policies.length);
					res.body.forEach((policy) => {
						expect(policy).to.have.all.keys('id', 'amountInsured', 'email', 'inceptionDate', 'installmentPayment', 'clientId');
						expect(policy.id).to.be.a('string');
						expect(policy.amountInsured).to.be.a('string');
						expect(policy.email).to.be.a('string');
						expect(policy.inceptionDate).to.be.a('string');
						expect(policy.installmentPayment).to.be.a('boolean');
						expect(policy.clientId).to.be.a('string');
					});
					done();
				});
		});

		it('get /policies/<policy_id>', (done) => {
			const randomPolicy = cache.policies.find((policy) => policy.clientId !== cache.user.id);
			request(process.env.ENTRY_POINT)
				.get(`/api/v1/policies/${randomPolicy.id}`)
				.set('authorization', cache.user.token)
				.send()
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(403);
					expect(res.body).to.be.deep.equal({
						message: 'Access Denied',
						code: 403,
					});
					done();
				});
		});
	});
});
