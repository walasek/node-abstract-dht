const crypto = require('crypto');

class XORMetric {
	static hash(input){
		return crypto.createHash('ripemd160').update(input).digest();
	}
	static equal(a,b){
		return Buffer.compare(a,b) === 0;
	}
	static toNumber(buf){
		let result = 0;
		for(let i = buf.length-1; i >= 0; i--){
			result += buf[i] << ((buf.length-i-1)*8);
		}
		return result;
	}
	static distance(a, b){
		const rsize = a.length > b.length ? a.length : b.length;
		const msize = a.length > b.length ? b.length : a.length;
		const result = Buffer.allocUnsafe(rsize);
		for(let i = 0; i < rsize; i++){
			if(i < msize){
				result[i] = a[i] ^ b[i];
			}else{
				result[i] = a[i] || b[i] || 0;
			}
		}
		return XORMetric.toNumber(result);
	}
	static size(){
		return this.hash(Buffer.from('test')).length;
	}
}

module.exports = XORMetric;