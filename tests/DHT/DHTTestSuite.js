const DHT = require('../../lib/DHT');
const Peer = require('../../lib/Peer');

class DHTTestSuite {
	constructor(desc){
		this.desc = desc;

		this.nodes = {};
		this.ids = {};
		this.peers = {};
		// Creation of instances
		Object.keys(desc).forEach(k => {
			if(k == 'events'){
				///
				return;
			}
			this.nodes[k] = new DHT({
				sendNodeLookup: this.buildEventHandle('sendNodeLookup', k) || ((peer, id) => {
					if(this.nodes[peer.ip]){
						let result;
						this.nodes[peer.ip].handleNodeLookup(peer, id, (r) => result = r);
						return result;
					}
					throw new Error(`Node ${peer.ip} does not exist`);
				}),
			});
			this.ids[k] = this.nodes[k].options.id;
			this.peers[k] = new Peer(k, 1000, this.ids[k]);
		});
		// k-buckets
		Object.keys(desc).forEach(k => {
			if(k == 'events'){
				///
				return;
			}
			if(desc[k].knows){
				desc[k].knows.forEach(v => {
					if(!this.peers[v]){
						// Create a virtual identity
						const dummy = new DHT();
						this.ids[v] = dummy.options.id;
						this.peers[v] = new Peer(v, 1000, this.ids[v]);
					}
					// Add to k-buckets
					this.nodes[k].buckets.put(this.nodes[k].options.metric.distance(this.ids[k], this.ids[v]), this.peers[v]);
				});
			}
		});
	}
	buildEventHandle(name, k){
		if(this.desc.events[k] && this.desc.events[k][name])
			return async (...args) => {
				return this.desc.events[k][name](...args);
			}
		return undefined;
	}
	close(){
		Object.values(this.nodes).forEach(n => n.close());
	}
}

module.exports = DHTTestSuite;