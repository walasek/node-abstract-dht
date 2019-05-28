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
	 * Retrieve a descriptor of node with _id_
	 * @param {Buffer} id The node to be found
	 * @returns {Peer}
	 */
	async nodeLookup(id){
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
			const result = await parallel(this.options.alpha, () => peers.length > 0, async (finish) => {
				const peer = peers[0];
				peers.shift();
				if(_inQueried(peer.id))
					return;
				queried.push(peer.id);
				try {
					const candidates = await this.options.sendNodeLookup(peer, id);
					this.touchPeer(peer);
					for(let j = 0; j < candidates.length; j++){
						if(Buffer.compare(candidates[j].id, id) == 0)
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
			res(result);
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