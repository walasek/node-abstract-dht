const DHT = require('../../lib/DHT');
const Peer = require('../../lib/Peer');
const Hash = require('../../lib/Hash');

module.exports = async (test) => {
	await test('nodeLookup can discover a peer, setup 1', async (t) => {
		// Build identities
		const id_a = new Hash('a').get();
		const id_b = new Hash('b').get();
		const id_x = new Hash('x').get(); // a will try to find x

		const p_a = new Peer('localhost', 1, id_a);
		const p_b = new Peer('localhost', 2, id_b);
		const p_x = new Peer('localhost', 100, id_x);

		// Build a proper DHT object for each tested node
		let a_lookup_count = 0;
		const a = new DHT({
			id: id_a,
			sendNodeLookup(peer, id){
				// a should ask b once
				a_lookup_count++;
				t.ok(Buffer.compare(id_b, peer.id) == 0);
				let result = null;
				b.handleNodeLookup(p_a, id, (p) => result=p);
				return result;
			}
		});
		const b = new DHT({
			id: id_b,
			sendNodeLookup(peer, id){
				// b should not send lookups
				t.fail('b sent a lookup');
			}
		});

		// Add test entries to k-buckets
		a.touchPeer(p_b);
		b.touchPeer(p_a);
		b.touchPeer(p_x);

		// Perform discovery on a to find peer x
		const result = await a.nodeLookup(id_x);
		const comparer = Peer.buildComparer(a.options.metric);
		t.equal(a_lookup_count, 1);
		t.equal(comparer(result, p_x), 0);
	});
};