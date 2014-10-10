var intf = require("../scripts/intf-core.js");
var assert = require("assert");

// TODO tests:
// post subthreading

//
// if in order
//	print id
// else if post.prevpost != null
//	printsubthread of post

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

	var post1 = intf.newPost({
		id: 1001,
		body: "'sup"
	});
	var post2 = intf.newPost({
		id: 1002,
		body: ">>1001 stfu"
	});
	var post3 = intf.newPost({
		id: 1003,
		body: ">>1002 no u"
	});
	var post4 = intf.newPost({
		id: 1004,
		body: ">>1001 no"
	});
	var post5 = intf.newPost({
		id: 1005,
		body: ">>1001 >>1002 no u"
	});
	var post6 = intf.newPost({
		id: 1006,
		body: ">>1001 >>1004 yes",
	});
	var post7 = intf.newPost({
		id: 1007,
		body: ">>1004 no what",
	});
	var post8 = intf.newPost({
		id: 1008,
		body: ">>1005 yes u",
	});

	assert.equal(intf.nextsib(post2, 1001), post4);
	assert.equal(intf.nextsib(post4, 1001), post5);
	assert.equal(intf.nextsib(post5, 1001), post6);
	assert.equal(intf.nextsib(post6, 1001), post2);

	assert.equal(intf.prevsib(post6, 1001), post5);
	assert.equal(intf.prevsib(post5, 1001), post4);
	assert.equal(intf.prevsib(post4, 1001), post2);
	assert.equal(intf.prevsib(post2, 1001), post6);

	assert.equal(intf.nextsib(post3, 1002), post5);
	assert.equal(intf.nextsib(post5, 1002), post3);
	assert.equal(intf.prevsib(post5, 1002), post3);
	assert.equal(intf.prevsib(post3, 1002), post5);

	assert.equal(intf.nextsib(post6, 1004), post7);
	assert.equal(intf.nextsib(post7, 1004), post6);
	assert.equal(intf.prevsib(post7, 1004), post6);
	assert.equal(intf.prevsib(post6, 1004), post7);

	assert.equal(intf.nextsib(post8, 1005), post8);
	assert.equal(intf.prevsib(post8, 1005), post8);

	assert.deepEqual(intf.childrenIds(post1), [1002, 1004, 1005, 1006]);
	assert.deepEqual(intf.childrenIds(post2), [1003, 1005]);
	assert.deepEqual(intf.childrenIds(post3), []);
	assert.deepEqual(intf.childrenIds(post4), [1006, 1007]);
	assert.deepEqual(intf.childrenIds(post5), [1008]);
	assert.deepEqual(intf.childrenIds(post6), []);
	assert.deepEqual(intf.childrenIds(post7), []);
	assert.deepEqual(intf.childrenIds(post8), []);

	assert.equal(post1.numReplies, 4);
	assert.equal(post2.numReplies, 2);
	assert.equal(post3.numReplies, 0);
	assert.equal(post4.numReplies, 2);
	assert.equal(post5.numReplies, 1);
	assert.equal(post6.numReplies, 0);
	assert.equal(post7.numReplies, 0);
	assert.equal(post8.numReplies, 0);
}

for (var name in test) {
	console.log("*** Testing", name);
	test[name]();
}




