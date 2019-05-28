const DHTTestSuite = require('./DHTTestSuite');

module.exports = async (test) => {
	await test('nodeLookup deep discovery', async (t) => {
		let a_jumps = 0;
		const suite = new DHTTestSuite({
			a: {knows: ['b'], id: Buffer.from([1])},
			b: {knows: ['c'], id: Buffer.from([2])},
			c: {knows: ['d'], id: Buffer.from([4])},
			d: {knows: ['e'], id: Buffer.from([8])},
			e: {knows: ['f'], id: Buffer.from([16])},
			f: {knows: ['g'], id: Buffer.from([32])},
			g: {knows: ['h'], id: Buffer.from([64])},
			h: {knows: ['x'], id: Buffer.from([128])},
			x: {knows: ['b'], id: Buffer.from([255])},
		});
		const result = await suite.nodes.a.nodeLookup(suite.ids.x, 3, false);
		t.equal(result.length, 3);
		t.equal(result[0].ip, 'x');
		t.equal(result[1].ip, 'h');
		t.equal(result[2].ip, 'g');
	});
}