class Peer {
	constructor(ip, port, id){
		this.ip = ip;
		this.port = port;
		this.id = id;
	}
	static buildComparer(metric){
		return (a,b) => metric.distance(a.id, b.id);
	}
}

module.exports = Peer;