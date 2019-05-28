const Hash = require('../lib/Hash');

module.exports = (test) => {
	test('Hash size', (t) => {
		const h = new Hash('test');
		t.equal(h.get().length, 20);
	});
	test('Hash equal', (t) => {
		const a = new Hash('a');
		const b = new Hash('a');
		const c = new Hash('c');

		t.ok(a.equal(b));
		t.notOk(b.equal(c));
		t.notOk(c.equal(a));
	});
	test('Hash immutability', (t) => {
		const d1 = Buffer.from('1bc');
		const a = new Hash(d1);

		const h1 = a.getRef();
		d1[0] = 'a';

		const b = new Hash(d1);
		t.notOk(a.equal(b));
	});
}