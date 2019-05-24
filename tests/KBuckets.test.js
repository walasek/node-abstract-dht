const KBuckets = require('../lib/KBuckets');

module.exports = (test) => {
	test('KBuckets works as a LRU for the same distance', (t) => {
		const b = new KBuckets(3, 32);
		b.put(0, 1);
		b.put(0, 2);
		b.put(0, 3);
		b.put(0, 4);

		const closest = b.getClosest();
		t.equal(closest.length, 3);
		t.equal(closest[0], 4);
		t.equal(closest[1], 3);
		t.equal(closest[2], 2);

		t.test('Can limit the closest entries', (t) => {
			const closest = b.getClosest(1);
			t.equal(closest.length, 1);
			t.equal(closest[0], 4);
		});
	});

	test('KBuckets work with multiple LRUs', (t) => {
		const b = new KBuckets(3, 32);
		b.put(1, 1);
		b.put(2, 2);
		b.put(3, 3);
		b.put(4, 4);
		b.put(64, 64);

		const closest = b.getClosest();
		t.equal(closest.length, 5);
		t.equal(closest[0], 1);
		t.equal(closest[1], 3); // 2 and 3 fall into 2-4 bucket, since 3 was added later it's first
		t.equal(closest[2], 2);
		t.equal(closest[3], 4);
		t.equal(closest[4], 64);

		t.test('Updating a value in distant bucket does not mess up the proper ordering', (t) => {
			b.put(64, 64);

			const closest = b.getClosest();
			t.equal(closest.length, 5);
			t.equal(closest[4], 64);
		});

		t.test('Trimming closest values works', (t) => {
			const closest = b.getClosest(2);
			t.equal(closest.length, 2);
			t.equal(closest[0], 1);
			t.equal(closest[1], 3);
		});

		t.test('Can iterate over KBuckets', (t) => {
			const found = [];
			for(let v of b.iterateValues()){
				found.push(v);
			}
			t.equal(found.length, 5);
			t.deepEqual(found, [1, 3, 2, 4, 64]);
		});

		t.test('Can grab closest values, test 1', (t) => {
			const closest = b.getClosestTo(1, 2);
			t.equal(closest.length, 2);
			t.equal(closest[0], 1);
			t.equal(closest[1], 2);
		});

		t.test('Can grab closest values, test 2', (t) => {
			const closest = b.getClosestTo(60, 2);
			t.equal(closest.length, 2);
			t.equal(closest[0], 64);
			t.equal(closest[1], 4);
		});

		t.test('Can grab all values sorted by distance', (t) => {
			const closest = b.getClosestTo(60);
			t.equal(closest.length, 5);
			t.deepEqual(closest, [64, 4, 3, 2, 1]);
		});
	});

	test('In case of ridiculous distances the library throws', (t) => {
		const b = new KBuckets(3, 32);
		t.throws(() => {
			b.put(Math.pow(2, 64));
		});
	});
};