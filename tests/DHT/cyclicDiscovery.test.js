const DHTTestSuite = require('./DHTTestSuite');

module.exports = async (test) => {
	await test('nodeLookup discovery with cycles', async (t) => {
		let a_jumps = 0;
		const suite = new DHTTestSuite({
			a: {knows: ['b']},
			b: {knows: ['c1', 'c2', 'c3']},
			c1: {knows: ['d']},
			c2: {knows: ['e']},
			c3: {knows: ['f']},
			d: {knows: ['b']},
			e: {knows: ['c3']},
			f: {knows: ['g']},
			g: {knows: ['h']},
			h: {knows: ['i', 'c1', 'd']},
			i: {knows: ['x', 'b', 'c3']},
			events: {
				a: {
					sendNodeLookup(peer, id){
						a_jumps++;
						return suite.nodes[peer.ip].handleNodeLookup(suite.peers.a, id);
					}
				},
			}
		});
		const result = await suite.nodes.a.nodeLookup(suite.ids.x);
		t.ok(Buffer.compare(result.id, suite.ids.x) == 0);
		// t.equal(a_jumps, 8); // Jumps are variable depending on rng
	});
}