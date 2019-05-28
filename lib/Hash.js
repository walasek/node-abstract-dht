const crypto = require('crypto');

class Hash {
	constructor(input){
		this._tmp = Hash.hash(input);
	}
	static hash(input){
		return crypto.createHash('ripemd160').update(input).digest();
	}
	static size(){
		return 20;
	}
	get(){
		return Buffer.from(this._tmp);
	}
	getRef(){
		return this._tmp;
	}
	equal(b){
		return Buffer.compare(this._tmp, b.getRef()) === 0;
	}
}

module.exports = Hash;