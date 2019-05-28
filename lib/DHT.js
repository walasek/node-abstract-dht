const EventEmitter = require('events');
const XORMetric = require('./XORMetric');
const KBuckets = require('./KBuckets');
const Peer = require('./Peer');
const Hash = require('./Hash');
const { parallel } = require('./Async');

const DEFAULT_OPTIONS = {
	id: null,
	// Size of k (redundancy count: 1-no redundancy, 20-ability to survive 19 nodes going offline)
	k: 20,
	// Count of parallel messages for node lookups
	alpha: 3,
	// Metric system
	metric: XORMetric,
	// Hash system
	hash: Hash,
	// Should handle events automaticaly update k-buckets?
	autoUpdateKBuckets: true,
	//-- Customizable callbacks
	// Send a lookup request to a peer, should result in an array of peers
	sendNodeLookup: (peer, id) => {throw new Error(`sendNodeLookup abstract`)}
};

class DHT extends EventEmitter {
	constructor(options={}){
		super();
		this.options = {...DEFAULT_OPTIONS, ...options};
		this.buckets = new KBuckets(this.options.k, this.options.hash.size(), Peer.buildComparer(XORMetric));
		if(!this.options.id)
			this.options.id = new Hash(Math.random().toString()).get();
	}
	close(){
		super.removeAllListeners();
	}
	hash(input){
		return new this.options.hash(input).get();
	}
	/**
	 * Retrieve up to _n_ descriptors closest to _id_.
	 * @param {Buffer} id The node to be found
	 * @param {Number} n The number of descriptors to return
	 * @param {Boolean} break_on_find Break the lookup when _id_ is found.
	 * @returns {Peer}
	 */
	async nodeLookup(id, n=1, break_on_find=true){
		return new Promise(async (res, rej) => {
			// 1. Build a peer list from closest to id to farthest
			// 2. Send at most alpha parallel queries
			// 3. If the result contains the target then optionaly verify and return
			// 3a. If not then properly inject the new nodes into the lookup list
			const lookup_peer = new Peer(null, null, id);
			const peers = this.buckets.getClosestTo(lookup_peer, this.options.k);
			const queried = [this.options.id]; // never query self
			function _inQueried(a){
				for(let i = 0; i < queried.length; i++){
					if(Buffer.compare(queried[i], a) == 0)
					//if(XORMetric.equal(queried[i], a))
						return true;
				}
				return false;
			}
			let result = [], result_max_distance = null;
			const _checkCandidate = (candidate) => {
				const dist = this.options.metric.distance(id, candidate.id);
				if(result_max_distance !== null){
					if(dist > result_max_distance)
						return;
				}
				if(result.findIndex(c => Buffer.compare(c[0].id, candidate.id) == 0) !== -1)
					return; // Duplicate
				result.push([candidate, dist]);
				if(result.length > n){
					result = result.sort((a,b) => a[1] - b[1]).slice(0, n);
					result_max_distance = result[result.length-1][1];
				}
			}
			await parallel(this.options.alpha, () => peers.length > 0, async (finish) => {
				const peer = peers[0];
				peers.shift();
				if(_inQueried(peer.id))
					return;
				queried.push(peer.id);
				try {
					const candidates = await this.options.sendNodeLookup(peer, id);
					this.touchPeer(peer);
					for(let j = 0; j < candidates.length; j++){
						_checkCandidate(candidates[j]);
						if(break_on_find && Buffer.compare(candidates[j].id, id) == 0)
							return finish(candidates[j]);
						if(!_inQueried(candidates[j].id))
							// TODO: Perhaps try to implement an insert with distance ordering perservance?
							peers.unshift(candidates[j]);
					}
				}catch(err){
					// Peer probably invalid?
					console.log(err);
				}
			});
			if(n == 1)
				return res(result[0][0]);
			res(result.map(v => v[0]));
		});
	}
	touchPeer(peer){
		this.buckets.put(this.options.metric.distance(this.options.id, peer.id), peer);
	}
	handleNodeLookup(peer, id, resp_fn){
		if(this.options.autoUpdateKBuckets)
			this.touchPeer(peer);
		const id_p = new Peer(null, null, id);
		resp_fn(this.buckets.getClosestTo(id_p, this.options.k));
	}
}

module.exports = DHT;