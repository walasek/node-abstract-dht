const DHTTestSuite = require('./DHTTestSuite');

module.exports = async (test) => {
	await test('nodeLookup deep discovery', async (t) => {
		let a_jumps = 0;
		const suite = new DHTTestSuite({
			a: {knows: ['b']},
			b: {knows: ['c']},
			c: {knows: ['d']},
			d: {knows: ['e']},
			e: {knows: ['f']},
			f: {knows: ['g']},
			g: {knows: ['h']},
			h: {knows: ['i']},
			i: {knows: ['x']},
			events: {
				a: {
					sendNodeLookup(peer, id){
						let res;
						suite.nodes[peer.ip].handleNodeLookup(peer, id, (r) => res = r);
						a_jumps++;
						return res;
					}
				},
			}
		});
		const result = await suite.nodes.a.nodeLookup(suite.ids.x);
		t.ok(Buffer.compare(result.id, suite.ids.x) == 0);
		t.equal(a_jumps, 8);
	});
}