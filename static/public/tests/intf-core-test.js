var intf = require("../scripts/intf-core.js");
var assert = require("assert");

function newDb() {
	var db = {};
	return function(id) {
		return db[id];
	}
}

var test = {};

test.creation = function() {
	intf = intf.newModule({
		getPost: newDb(),
	});
	var id, body;

	id = 1001;
	body = [
		"git out",
	].join("\n");
	var post1 = intf.newPost({id: id, body: body});

	assert.equal(post1.id, id);
	assert.equal(post1.body, body);
	assert.deepEqual(post1.parentIds, []);
	assert.equal(post1.norder.nextpost, null);
	assert.equal(post1.norder.prevpost, null);

	id = 1002;
	body = "nope";
	var post2 = intf.newPost({id: id, body: body});

	assert.equal(post2.id, id);
	assert.equal(post2.body, body);
	assert.deepEqual(post2.parentIds, []);

	assert.equal(intf.prevnorder(post2), post1);
	assert.equal(intf.nextnorder(post2), null);

	id = 1003;
	body = ">>1001 >>1002 yep";
	var post3 = intf.newPost({id: id, body: body});

	assert.equal(post3.id, id);
	assert.equal(post3.body, body);
	assert.deepEqual(post3.parentIds, [1001, 1002]);

	assert.equal(intf.nextnorder(post1), post2);
	assert.equal(intf.nextnorder(post2), post3);
	assert.equal(intf.nextnorder(post3), null);

	assert.equal(intf.prevnorder(post3), post2);
	assert.equal(intf.prevnorder(post2), post1);
	assert.equal(intf.prevnorder(post1), null);
}

test.linking = function() {
	intf = intf.newModule({
		getPost: newDb(),
	});
	var post = createSampleThread1(intf);

	assert.equal(intf.nextsib(post[2], 1001), post[4]);
	assert.equal(intf.nextsib(post[4], 1001), post[5]);
	assert.equal(intf.nextsib(post[5], 1001), post[6]);
	assert.equal(intf.nextsib(post[6], 1001), post[2]);

	assert.equal(intf.prevsib(post[6], 1001), post[5]);
	assert.equal(intf.prevsib(post[5], 1001), post[4]);
	assert.equal(intf.prevsib(post[4], 1001), post[2]);
	assert.equal(intf.prevsib(post[2], 1001), post[6]);

	assert.equal(intf.nextsib(post[3], 1002), post[5]);
	assert.equal(intf.nextsib(post[5], 1002), post[3]);
	assert.equal(intf.prevsib(post[5], 1002), post[3]);
	assert.equal(intf.prevsib(post[3], 1002), post[5]);

	assert.equal(intf.nextsib(post[6], 1004), post[7]);
	assert.equal(intf.nextsib(post[7], 1004), post[6]);
	assert.equal(intf.prevsib(post[7], 1004), post[6]);
	assert.equal(intf.prevsib(post[6], 1004), post[7]);

	assert.equal(intf.nextsib(post[8], 1005), post[8]);
	assert.equal(intf.prevsib(post[8], 1005), post[8]);

	assert.deepEqual(intf.childrenIds(post[1]), [1002, 1004, 1005, 1006]);
	assert.deepEqual(intf.childrenIds(post[2]), [1003, 1005]);
	assert.deepEqual(intf.childrenIds(post[3]), []);
	assert.deepEqual(intf.childrenIds(post[4]), [1006, 1007]);
	assert.deepEqual(intf.childrenIds(post[5]), [1008]);
	assert.deepEqual(intf.childrenIds(post[6]), []);
	assert.deepEqual(intf.childrenIds(post[7]), []);
	assert.deepEqual(intf.childrenIds(post[8]), [1009]);
	assert.deepEqual(intf.childrenIds(post[9]), []);

	assert.equal(post[1].numReplies, 4);
	assert.equal(post[2].numReplies, 2);
	assert.equal(post[3].numReplies, 0);
	assert.equal(post[4].numReplies, 2);
	assert.equal(post[5].numReplies, 1);
	assert.equal(post[6].numReplies, 0);
	assert.equal(post[7].numReplies, 0);
	assert.equal(post[8].numReplies, 1);
	assert.equal(post[9].numReplies, 0);
}

test.attachment = function() {
	intf = intf.newModule({
		getPost: newDb(),
	});
	var post = createSampleThread1(intf);

	intf.postdb.print();
	console.log("-----");

	intf.attachToParent(post[2], post[1]);
	intf.postdb.print();
	console.log("-----");

	intf.attachToParent(post[9], post[8]);
	intf.postdb.print();
}

function createSampleThread1(intf) {
	var post = {};
	post[1] = intf.newPost({
		id: 1001,
		body: "'sup"
	});
	post[2] = intf.newPost({
		id: 1002,
		body: ">>1001 stfu"
	});
	post[3] = intf.newPost({
		id: 1003,
		body: ">>1002 no u"
	});
	post[4] = intf.newPost({
		id: 1004,
		body: ">>1001 no"
	});
	post[5] = intf.newPost({
		id: 1005,
		body: ">>1001 >>1002 no u"
	});
	post[6] = intf.newPost({
		id: 1006,
		body: ">>1001 >>1004 yes",
	});
	post[7] = intf.newPost({
		id: 1007,
		body: ">>1004 no what",
	});
	post[8] = intf.newPost({
		id: 1008,
		body: ">>1005 yes u",
	});
	post[9] = intf.newPost({
		id: 1009,
		body: ">>1008 no u fok u",
	});
	return post;
}


for (var name in test) {
	console.log("*** Testing", name);
	test[name]();
}





