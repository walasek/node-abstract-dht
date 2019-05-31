const DHTTestSuite = require('./DHTTestSuite');

module.exports = async (test) => {
	await test('Basic DHT store and get', async (t) => {
		const store_ops = {};
		const store_fn = (peer_id) => {
			return (key, value) => {
				store_ops[peer_id] = (store_ops[peer_id] || 0) + 1;
			}
		}
		const get_ops = {};
		const get_fn = (peer_id) => {
			return (key) => {
				get_ops[peer_id] = (get_ops[peer_id] || 0) + 1;
				return 1;
			}
		};
		const suite = new DHTTestSuite({
			a: {knows: ['b'], id: Buffer.from([1])},
			b: {knows: ['c'], id: Buffer.from([2])},
			c: {knows: ['d'], id: Buffer.from([4])},
			d: {knows: ['a'], id: Buffer.from([8])},
			events: {
				a: {storeValue: store_fn('a'), getValue: get_fn('a')},
				b: {storeValue: store_fn('b'), getValue: get_fn('b')},
				c: {storeValue: store_fn('c'), getValue: get_fn('c')},
				d: {storeValue: store_fn('d'), getValue: get_fn('d')},
			}
		}, {
			k: 2,
		});
		// Generate a key so that it will be placed on d and c
		const KEY = suite.generateKeyForNode('d', 'c');
		const VALUE = 'my_value';
		await suite.nodes.a.putValue(KEY, VALUE);
		t.equal(store_ops.a || 0, 0);
		t.equal(store_ops.b || 0, 0);
		t.equal(store_ops.c || 0, 1);
		t.equal(store_ops.d || 0, 1);
		t.equal(get_ops.a || 0, 0);
		t.equal(get_ops.b || 0, 0);
		t.equal(get_ops.c || 0, 0);
		t.equal(get_ops.d || 0, 0);

		await suite.nodes.a.getValue(KEY);
		t.equal(store_ops.a || 0, 0);
		t.equal(store_ops.b || 0, 0);
		t.equal(store_ops.c || 0, 1);
		t.equal(store_ops.d || 0, 1);
		t.equal(get_ops.a || 0, 0);
		t.equal(get_ops.b || 0, 0);
		t.equal(get_ops.c || 0, 1);
		t.equal(get_ops.d || 0, 1);
	});
}