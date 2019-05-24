const XORMetric = require('../lib/XORMetric');

module.exports = (test) => {
	test('XORMetric allows hashing things', (t) => {
		const buf = Buffer.from('Some data');
		const h = XORMetric.hash(buf);

		t.equal(h.length, 160 / 8); // 20 bytes
		t.equal(XORMetric.size(), 20);
	});
	test('XORMetric distance is a number, and it\'s a XOR of arguments', (t) => {
		const a = Buffer.alloc(20, 0);
		const b = Buffer.alloc(20, 0);

		t.test('XOR test 1', (t) => {
			a[19] = 1;
			b[19] = 2;
			t.equal(XORMetric.distance(a,b), 3);
			t.equal(XORMetric.distance(b,a), XORMetric.distance(a,b));
		});

		t.test('XOR test 2', (t) => {
			a[19] = 2;
			t.equal(XORMetric.distance(a,b), 0);
		});

		t.test('XOR test 3', (t) => {
			a[19] = 1;
			b[19] = 0;
			b[18] = 1;
			t.equal(XORMetric.distance(a,b), 1+256);
		});
	});
	test('XORMetric has a tolerance for variable length buffers', (t) => {
		const a = Buffer.alloc(1, 0);
		const b = Buffer.alloc(2, 0);

		a[0] = 1;
		b[0] = 2;

		t.equal(XORMetric.distance(a,b), 3 << 8);
		t.equal(XORMetric.distance(b,a), XORMetric.distance(a,b));
	});
}