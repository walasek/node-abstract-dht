const LRUArray = require('./LRU');

class KBuckets {
	constructor(k, length, comparer=(a,b) => a - b){
		this.k = k;
		this.length = length;
		this.comparer = comparer;
		this.buckets = Array.apply(null, Array(length)).map(v => new LRUArray(k, comparer));
	}
	bucketForDist(dist){
		for(let i = 0; i < this.buckets.length; i++){
			if(Math.pow(2, i+1) > dist){
				return this.buckets[i];
			}
		}
		throw new Error(`Invalid distance`);
	}
	put(dist, peer){
		this.bucketForDist(dist).put(peer);
	}
	getClosest(n=null){
		let result = [];
		for(let i = 0; i < this.buckets.length; i++){
			if(!n || (this.buckets[i].count()+result.length <= n)){
				result = result.concat(this.buckets[i].getArray());
			}else{
				result = result.concat(this.buckets[i].getArray().slice(0, n-result.length));
			}
		}
		return result;
	}
	*iterateValues(){
		for(let i = 0; i < this.buckets.length; i++){
			for(let j = 0; j < this.buckets[i].getArray().length; j++){
				yield this.buckets[i].getArray()[j];
			}
		}
	}
	getClosestTo(a, n=null){
		const result = [];
		for(let b of this.iterateValues()){
			result.push([b, Math.abs(this.comparer(a, b))]);
		}
		result.sort((a, b) => a[1] - b[1]); // Sort asc by distance
		return result.map(v => v[0]).slice(0, n);
	}
}

module.exports = KBuckets;