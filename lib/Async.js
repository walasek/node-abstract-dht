async function parallel(jobs, checfn, job){
	const running = [];
	let result;
	for(let i = 0; i < jobs; i++){
		running.push((async () => {
			while(checfn() && result === undefined)
				await job((r) => {
					if(result === undefined)
						result = r;
				});
		})());
	}
	await Promise.all(running);
	return result;
}

// Dummy for test purposes:
/*async function parallel(jobs, checkfn, job){
	let result;
	while(checkfn()){
		await job((r) => result=r);
		if(result)
			return result;
	}
}*/

module.exports = {
	parallel,
};