const EventEmitter = require('events');
const XORMetric = require('./XORMetric');
const KBuckets = require('./KBuckets');
const Peer = require('./Peer');

const DEFAULT_OPTIONS = {
	// Size of k (redundancy count: 1-no redundancy, 20-ability to survive 19 nodes going offline)
	k: 20,
	// Count of parallel messages for node lookups
	alpha: 3,
	// Metric system
	metric: XORMetric,
	//-- Customizable callbacks
	// Send a lookup request to a peer, should result in an array of peers
	sendNodeLookup: (peer, id) => {throw new Error(`sendNodeLookup abstract`)}
};

class DHT extends EventEmitter {
	constructor(options={}){
		super();
		this.options = {...DEFAULT_OPTIONS, ...options};
		this.buckets = new KBuckets(this.options.k, this.options.metric.size(), Peer.buildComparer(XORMetric));
	}
	close(){
		super.removeAllListeners();
	}
	hash(input){
		return this.options.metric.hash(input);
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
			const queried = [];
			function _inQueried(a){
				for(let i = 0; i < queried.length; i++){
					if(XORMetric.equal(queried[i], a))
						return true;
				}
				return false;
			}
			// TODO: Implement parallel queries
			for(let i = 0; i < peers.length; i++){
				if(_inQueried(peers[i].id))
					continue;
				const candidates = await this.options.sendNodeLookup(peers[i], id);
				queried.push(peers[i].id);
				for(let j = 0; j < candidates.length; j++){
					if(XORMetric.equal(candidates[j].id, id))
						// Boom
						return res(candidates[j]);
				}
				// Our lookup was not contained within the array
				// TODO: Do something with the candidates?
				//		Is this secure?
				candidates.forEach(c => peers.push(c));
			}
			// Not found
			res(null);
		});
	}
	handleNodeLookup(peer, id, resp_fn){
		resp_fn(this.buckets.getClosestTo(id, this.options.k));
	}
}

module.exports = DHT;