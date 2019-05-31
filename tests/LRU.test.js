const LRUArray = require('../lib/LRU');

module.exports = (test) => {
	test('Basic LRU function', (t) => {
		const lru = new LRUArray(3);
		lru.put(1);
		lru.put(2);
		lru.put(3);

		const result = lru.getArray();
		t.equal(result.length, 3);
		t.equal(result[0], 3);
		t.equal(result[1], 2);
		t.equal(result[2], 1);
	});
	test('LRU moves occurences to front', (t) => {
		const lru = new LRUArray(3);
		lru.put(1);
		lru.put(2);
		lru.put(1);

		const result = lru.getArray();
		t.equal(result.length, 2);
		t.equal(result[0], 1);
		t.equal(result[1], 2);
	});
	test('LRU keeps maximum size', (t) => {
		const lru = new LRUArray(3);
		lru.put(1);
		lru.put(2);
		lru.put(3);
		lru.put(4);

		const result = lru.getArray();
		t.equal(result.length, 3);
		t.equal(result[0], 4);
		t.equal(result[1], 3);
		t.equal(result[2], 2);
	});
	test('LRU can compare objects when provided a comparer function', (t) => {
		const lru = new LRUArray(3, (a,b) => a.v - b.v);
		lru.put({v: 1});
		lru.put({v: 2});
		lru.put({v: 1});

		const result = lru.getArray();
		t.equal(result.length, 2);
		t.equal(result[0].v, 1);
		t.equal(result[1].v, 2);
	});
	test('LRU does nothing with one entry', (t) => {
		const lru = new LRUArray(3);
		lru.put(1);
		lru.put(1);

		const result = lru.getArray();
		t.equal(result.length, 1);
		t.equal(result[0], 1);
	});
	test('LRU uses a function when poping', (t) => {
		let called = 0;
		const lru = new LRUArray(3, undefined, () => {
			called++;
			return false;
		});
		lru.put(1);
		lru.put(2);
		lru.put(3);
		lru.put(4);

		const result = lru.getArray();
		t.equal(result.length, 3);
		t.equal(result[0], 3);
		t.equal(result[1], 2);
		t.equal(result[2], 1);
		t.equal(called, 1);
	});
}