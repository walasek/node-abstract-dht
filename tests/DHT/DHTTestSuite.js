const DHT = require('../../lib/DHT');
const Peer = require('../../lib/Peer');

class DHTTestSuite {
	constructor(desc, dht_opts={}){
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
				...dht_opts,
				sendNodeLookup: this.buildEventHandle('sendNodeLookup', k) || ((peer, id) => {
					if(this.nodes[peer.ip]){
						let result;
						this.nodes[peer.ip].handleNodeLookup(peer, id, (r) => result = r);
						return result;
					}
					throw new Error(`Node ${peer.ip} does not exist`);
				}),
				sendStoreRequest: this.buildEventHandle('sendStoreRequest', k) || ((peer, key, value, id) => {
					if(this.nodes[peer.ip]){
						let result;
						this.nodes[peer.ip].handleStoreRequest(peer, key, value, id, (r) => result = r);
						return result;
					}
					throw new Error(`Node ${peer.ip} does not exist`);
				}),
				storeValue: this.buildEventHandle('storeValue', k) || ((key, value, id) => {
					if(!this.nodes[k]._mem)
						this.nodes[k]._mem = {};
					this.nodes[k]._mem[key] = value;
				}),
				sendGetRequest: this.buildEventHandle('sendGetRequest', k) || ((peer, key, id) => {
					if(this.nodes[peer.ip]){
						let result;
						this.nodes[peer.ip].handleGetRequest(peer, key, id, (r) => result = r);
						return result;
					}
					throw new Error(`Node ${peer.ip} does not exist`);
				}),
				getValue: this.buildEventHandle('getValue', k) || ((key, id) => {
					return this.nodes[k]._mem[key];
				}),
				id: desc[k].id,
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
					this.nodes[k].touchPeer(this.peers[v]);
				});
			}
		});
	}
	buildEventHandle(name, k){
		if(this.desc.events && this.desc.events[k] && this.desc.events[k][name])
			return async (...args) => {
				return this.desc.events[k][name](...args);
			}
		return undefined;
	}
	generateKeyForNode(...prefs){
		let watchdog = 0;
		while(watchdog < Object.keys(this.nodes).length*1000){
			const rand = Math.random().toString();
			const id = this.nodes[prefs[0]].hash(rand);
			const dists = Object.keys(this.nodes).map(k => [this.nodes[k], this.nodes[k].options.metric.distance(this.nodes[k].options.id, id), k]);
			dists.sort((a,b) => a[1]-b[1]);
			let ok = true;
			for(let i = 0; i < prefs.length; i++){
				if(dists[i][0] != this.nodes[prefs[i]]){
					ok = false;
					break;
				}
			}
			if(ok)
				return rand;
			watchdog++;
		}
		throw new Error(`RNG fault, please retry`);
	}
	close(){
		Object.values(this.nodes).forEach(n => n.close());
	}
}

module.exports = DHTTestSuite;