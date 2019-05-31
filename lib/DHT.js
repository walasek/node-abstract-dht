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
	sendNodeLookup: null, // async (peer, id) => {throw new Error(`sendNodeLookup abstract`)},
	// Send a store request to a peer
	sendStoreRequest: null, // async (peer, key, value, id) => {throw new Error(`sendStoreRequest abstract`)},
	// Store a value
	storeValue: null, // async (key, value, id) => {throw new Error(`storeValue abstract`)},
	// Send a retrieve request to a peer
	sendGetRequest: null, // async (peer, key, id) => {throw new Error(`sendGetRequest abstract`)},
	// Retrieve a value
	getValue: null, // async (key, id) => {throw new Error(`getValue abstract`)},
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
				const peer = peers.shift();
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
	async handleNodeLookup(peer, id){
		if(this.options.autoUpdateKBuckets)
			this.touchPeer(peer);
		const id_p = new Peer(null, null, id);
		return this.buckets.getClosestTo(id_p, this.options.k);
	}
	/**
	 * Store some data in the DHT.
	 * @param {String|Buffer} key
	 * @param {Buffer} value
	 */
	async putValue(key, value){
		// 1. Find k closest peers, don't break on peer found
		// 2. Send a store request
		// Automatic re-broadcast is not performed!
		const id = this.hash(key);
		const closest = await this.nodeLookup(id, this.options.k, false);
		const sent_to = [];
		await parallel(this.options.alpha, () => sent_to.length < this.options.k && closest.length > 0, async (finish) => {
			const peer = closest.shift();
			try {
				await this.options.sendStoreRequest(peer, key, value, id);
				sent_to.push(peer);
			}catch(err){
				console.log(err);
			}
		});
	}
	async handleStoreRequest(peer, key, value, id){
		if(this.options.autoUpdateKBuckets)
			this.touchPeer(peer);
		const dummy_peer = new Peer(null, null, id);
		const closest = this.buckets.getClosestTo(dummy_peer, this.options.k);
		const farthest_dist = this.options.metric.distance(id, closest.pop().id);
		const dist = this.options.metric.distance(this.options.id, id);
		if(dist <= farthest_dist){
			// Store the value
			await this.options.storeValue(key, value, id);
		}else{
			// Other peers are closer, don't store
		}
		return (dist <= farthest_dist); // TODO: Response?
	}
	/**
	 * Retrieve data from the DHT.
	 * @param {String|Buffer} key
	 */
	async getValue(key){
		const id = this.hash(key);
		const closest = await this.nodeLookup(id, this.options.k, false);
		const result = await parallel(this.options.alpha, () => closest.length > 0, async (finish) => {
			const peer = closest.shift();
			try {
				const result = await this.options.sendGetRequest(peer, key, id);
				if(result){
					finish(result);
				}
			}catch(err){
				console.log(err);
			}
		});
		return result;
	}
	async handleGetRequest(peer, key, id){
		if(this.options.autoUpdateKBuckets)
			this.touchPeer(peer);
		const v = await this.options.getValue(key, id);
		return v;
	}
}

module.exports = DHT;