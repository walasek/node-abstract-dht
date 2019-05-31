const DHTTestSuite = require('../DHT/DHTTestSuite');

module.exports = async (test) => {
	test('E2E - P2P simulation', async (t) => {
		const suite = new DHTTestSuite({
			bootstrap: {},
			a: {},
			b: {},
			c: {},
			d: {},
			e: {},
			f: {},
		}, {
			k: 2
		});
		await t.test('Access to values published after join (keys close to publisher)', async (t) => {
			// Setup, a joins the network
			await suite.joinNode('a', 'bootstrap');
			// a gets to know a value
			const k1_a = suite.generateKeyForNode('a');
			await suite.nodes.a.putValue(k1_a, 'v1');
			// b joins the network
			await suite.joinNode('b', 'bootstrap');
			// b can access the previous value
			const v = await suite.nodes.b.getValue(k1_a);
			t.equal(v, 'v1');
		});

		await t.test('Access to values published before join (keys close to publisher)', async (t) => {
			// c stores a value close to it
			const k2_c = suite.generateKeyForNode('c');
			await suite.nodes.c.putValue(k2_c, 'v2');
			// other peers can't access it
			t.notOk(await suite.nodes.a.getValue(k2_c));
			t.notOk(await suite.nodes.b.getValue(k2_c));
			// c joins the network
			await suite.joinNode('c', 'bootstrap');
			// others can access the value
			t.equal(await suite.nodes.a.getValue(k2_c), 'v2');
			t.equal(await suite.nodes.b.getValue(k2_c), 'v2');
		});
	});
}