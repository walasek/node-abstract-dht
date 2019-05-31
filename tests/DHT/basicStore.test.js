const DHTTestSuite = require('./DHTTestSuite');

module.exports = async (test) => {
	await test('Basic DHT store + lookup', async (t) => {
		let b_stores = 0, a_stores = 0;
		const suite = new DHTTestSuite({
			a: {knows: ['b']},
			b: {knows: ['a']},
			events: {
				a: {
					storeValue(key, value, id){
						a_stores++;
					}
				},
				b: {
					storeValue(key, value, id){
						b_stores++;
					}
				}
			}
		});
		const result = await suite.nodes.a.nodeLookup(suite.ids.b);
		t.ok(Buffer.compare(result.id, suite.ids.b) == 0);

		const KEY = 'my_key';
		const VALUE = 'my_value';
		const result2 = await suite.nodes.a.putValue(KEY, VALUE);
		t.equal(b_stores, 1);
		t.equal(a_stores, 1);
	});
}