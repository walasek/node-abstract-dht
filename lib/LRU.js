/**
 * @class
 * Least-recently-used collection with maximum size
 */
class LRUArray {
	/**
	 * @constructor
	 * @param {Number} size The maximum size of the array
	 * @param {function} comparer A function that takes two arguments and returns two if the arguments are equal (default: a - b)
	 */
	constructor(size, comparer=(a,b) => a - b){
		this.data = [];
		this.fn = comparer;
		this.size = size;
	}
	/**
	 * Put a value into the array.
	 * @param {*} value Put a value into the array. If it was seen before it will be moved to the front. If there is no more space then least recently put value will be removed.
	 */
	put(value){
		for(let i = 0; i < this.data.length; i++){
			if(this.fn(this.data[i], value) === 0){
				if(i != 0){
					// Move to the front
					this.data.unshift(this.data.splice(i, i+1)[0]);
				}else{
					// Already in front
				}
				return;
			}
		}
		// Not in the array
		// Check space
		if(this.data.length >= this.size)
			// TODO: Ping instead of immediately removing
			this.data.pop();
		// Add
		this.data.unshift(value);
	}
	/**
	 * Return the contents as a reference;
	 * @returns {Array(*)}
	 */
	getArray(){
		return this.data;
	}
	/**
	 * Return the element count
	 */
	count(){
		return this.data.length;
	}
}

module.exports = LRUArray;