const {parallel} = require('../lib/Async');

module.exports = async (test) => {
	await test('Async - parallel, result', async (t) => {
		let state = 0;
		await parallel(3, () => state < 10, async () => {
			state++;
			await new Promise(res => setTimeout(res, 100));
		});
		t.equal(state, 10);
	});
	await test('Async - limits jobs', async (t) => {
		let state = 0;
		let active = 0;
		const xval = setInterval(() => {
			if(active > 3){
				t.fail('Witnessed more than 3 active (xval)');
				clearInterval(xval);
			}
		}, 50);
		await parallel(3, () => state < 10, async () => {
			active++;
			if(active > 3)
				t.fail('Witnessed more than 3 active');
			state++;
			await new Promise(res => setTimeout(res, 100));
			active--;
		});
		clearInterval(xval);
	});
	await test('Async - result', async (t) => {
		let state = 0;
		const result = await parallel(3, () => state < 10, async (res) => {
			let mystate = ++state;
			await new Promise(res => setTimeout(res, mystate*100));
			res(mystate);
		});
		await new Promise(res => setTimeout(res, 5000));
		t.equal(state, 3);
		t.equal(result, 1);
	});
};