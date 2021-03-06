var intf = require("../scripts/intf-core.js");
var assert = require("assert");

function newDb() {
    var db = {};
    return function(id) {
        return db[id];
    }
}

var test = {};

test.testGeneral = function() {
    intf = createSampleThread3();
    var linkages = [["1006", "1002"], ["1010", "1004"], ["1009", "1003"], ["1005", "1002"], ["1002", "1001"], ["1008", "1001"], ["1016", "1008"], ["1008", "1003"], ["1007", "1001"], ["1004", "1001"], ["1003", "1001"]];

    intf.postdb.print();
    linkPosts(intf, linkages);
}

test.testGeneral2 = function() {
    var sauce = [
        {id:"0", parentIds:[]},
        {id:"1", parentIds:["0"]},
        {id:"2", parentIds:["1"]},
        {id:"3", parentIds:["1"]},
        {id:"4", parentIds:["0"]},
        {id:"5", parentIds:["4"]},
        {id:"6", parentIds:["0", "1", "2"]},
        {id:"7", parentIds:["6"]},
        {id:"8", parentIds:["6", "4"]},
        {id:"9", parentIds:["6"]},
        {id:"10", parentIds:["9", "3", "6"]},
        {id:"11", parentIds:["6"]},
        {id:"12", parentIds:["0", "1", "4"]},
        {id:"13", parentIds:["0", "4", "10"]},
        {id:"14", parentIds:["13", "8"]},
        {id:"15", parentIds:["13"]},
        {id:"16", parentIds:[]},
        {id:"17", parentIds:["0", "1"]}
    ]
    var intf = createThreadFromSource(sauce);
    var linkages = [["1", "0"], ["2", "1"], ["6", "2"], ["4", "0"], ["6", "2"], ["7", "6"], ["1", "0"], ["4", "0"], ["6", "0"], ["4", "0"], ["6", "0"]]

    intf.postdb.print();
    linkPosts(intf, linkages);
}

test.testGeneral3 = function() {
    var sauce = [
        {id:"0", parentIds:[]},
        {id:"1", parentIds:["0"]},
        {id:"2", parentIds:["1"]},
        {id:"3", parentIds:["1"]},
        {id:"4", parentIds:["0"]},
        {id:"5", parentIds:["4"]},
        {id:"6", parentIds:["0", "1", "2"]},
        {id:"7", parentIds:["6"]},
        {id:"8", parentIds:["6", "4"]},
        {id:"9", parentIds:["6"]},
        {id:"10", parentIds:["9", "3", "6"]},
        {id:"11", parentIds:["6"]},
        {id:"12", parentIds:["0", "1", "4"]},
        {id:"13", parentIds:["0", "4", "10"]},
        {id:"14", parentIds:["13", "8"]},
        {id:"15", parentIds:["13"]},
        {id:"16", parentIds:[]},
        {id:"17", parentIds:["0", "1"]}
    ]
    var intf = createThreadFromSource(sauce);
    var linkages = [["1", "0"], ["4", "0"], ["6", "0"], ["12", "0"], ["13", "0"], ["14", "13"], ["4", "0"], ["8", "4"], ["14", "8"], ["6", "0"], ["13", "0"], ["4", "0"], ["1", "0"], ["4", "0"], ["1", "0"], ["4", "0"], ["6", "0"], ["12", "0"], ["13", "0"], ["12", "0"], ["1", "0"], ["4", "0"], ["6", "0"], ["12", "0"], ["4", "0"], ["8", "6"]];

    intf.postdb.print();
    linkPosts(intf, linkages);
}


test.testCreation = function() {
    intf = intf.newModule();
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

test.testLinking = function() {
    intf = intf.newModule();
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

test.testInNorderCase = function() {
    function aliases(intf) {
        var al = {};
        al.p = intf.getPost.bind(intf);
        al.subt = function(id) { return intf.getSubthread(intf.getPost(id)); }
        al.supt = function(id) { return intf.getSupthread(intf.getPost(id)); }
        al.subtIds = function(id) { return intf.getSubthreadIds(intf.getPost(id)); }
        al.suptIds = function(id) { return intf.getSupthreadIds(intf.getPost(id)); }
        return al;
    }

    intf = createSampleThread2();
    var al = aliases(intf);

    function assertEndPostIndented(id) {
        var posts = al.subt(id);
        assert.ok(intf.isIndented(posts[posts.length-1]));
    }

    intf.postdb.print();

    // - both inNorder
    intf.attachToParent(al.p(1002), al.p(1001));
    intf.postdb.print();
    //assert.deepEqual(al.subtIds(1001), ["1001", "1002", "1003", "1004"]);
    //assertEndPostIndented(1001);
    validateState(intf, 1001, ["1001", "1002", "1003", "1004"]);
    validateInn(intf);

    intf.attachToParent(al.p(1014), al.p(1012));
    intf.postdb.print();
    validateState(intf, 1012, ["1012", "1014"]);
    validateState(intf, 1001, ["1001", "1002", "1003", "1004"]);
    validateInn(intf);

    intf.attachToParent(al.p(1015), al.p(1008));
    intf.postdb.print();
    validateState(intf, 1008, ["1008", "1015", "1016"]);
    validateState(intf, 1012, ["1012", "1014"]);
    validateState(intf, 1001, ["1001", "1002", "1003", "1004"]);
    validateInn(intf);

    // undented(parent), indented(parent)
    intf.attachToParent(al.p(1003), al.p(1001));
    intf.postdb.print();
    validateState(intf, 1008, ["1008", "1015", "1016"]);
    validateState(intf, 1012, ["1012", "1014"]);
    validateState(intf, 1001, ["1001", "1003", "1004", "1007"]);
    validateInn(intf);

    // undented(parent), innorder(parent)
    intf.attachToParent(al.p(1002), al.p(1001));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1003", "1004"]);
    validateState(intf, 1008, ["1008", "1015", "1016"]);
    validateState(intf, 1012, ["1012", "1014"]);
    validateInn(intf);

    // innorder(parent), indented(parent)
    intf.attachToParent(al.p(1015), al.p(1011));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1003", "1004"]);
    validateState(intf, 1012, ["1012", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);
    validateState(intf, 1011, ["1011", "1015"]);
    validateInn(intf);

    intf.clearSubthread(al.p(1011), null, true);
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1003", "1004"]);
    validateState(intf, 1012, ["1012", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);
    assert.ok(intf.isInNorder(al.p(1011)));
    assert.ok(intf.isInNorder(al.p(1015)));
    validateInn(intf);

    intf.attachToParent(al.p(1014), al.p(1006));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1003", "1004"]);
    validateState(intf, 1006, ["1006", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);
    validateInn(intf);

    // siblings
    intf.attachToParent(al.p(1004), al.p(1002));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1004", "1007", "1005"]);
    validateState(intf, 1006, ["1006", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);
    validateInn(intf);

    intf.attachToParent(al.p(1004), al.p(1005));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1005", "1004"]);
    validateState(intf, 1006, ["1006", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);
    validateInn(intf);

    // ancestor
    intf.attachToParent(al.p(1014), al.p(1006));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1005", "1004"]);
    validateState(intf, 1006, ["1006", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);

    intf.attachToParent(al.p(1002), al.p(1001));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1002", "1005", "1004"]);
    validateState(intf, 1006, ["1006", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);
    validateInn(intf);

    intf.attachToParent(al.p(1004), al.p(1001));
    intf.postdb.print();
    //validateState(intf, 1001, ["1001", "1004", "1007", "1008"]);
    validateState(intf, 1001, ["1001", "1004", "1007"]);
    validateState(intf, 1006, ["1006", "1014"]);
    validateState(intf, 1008, ["1008", "1016"]);
    validateInn(intf);

    intf.attachToParent(al.p(1014), al.p(1004));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1004", "1014", "1013", "1010"]);
    validateState(intf, 1008, ["1008", "1016"]);
    validateInn(intf);

    intf.attachToParent(al.p(1008), al.p(1014));
    intf.postdb.print();
    validateState(intf, 1001, ["1001", "1004", "1014", "1008", "1016"]);
    validateInn(intf);

}

var validateInn = function(intf) {
    var innPosts = intf.postdb.inNorderPosts();
    innPosts.forEach(function(post) {
        var ind = intf.isIndented(post);
        var inn = intf.isInNorder(post);
        assert.ok(!ind && inn,
                    post.id + " is inNorder but ind="+ind +
                    " inn="+inn);
    });
}

var validateState = function(intf, id, expected) {
    var post = intf.getPost(id)
    if (!intf.isSubthreadRoot(post)) {
        console.warn("** validating a non-root post", id, "skipping...");
        return;
    }

    var ids = intf.getSubthreadIds(post);
    var bid = ids[ids.length-1];
    assert.deepEqual(ids, expected);
    assert.deepEqual(ids.slice(0).reverse(), intf.getSupthreadIds(intf.getPost(bid)));
    assertAll(intf.getSubthread(id), function(post) {
        return !intf.isInNorder(post);
    });
    assert.ok(intf.isIndented(intf.getPost(bid)));
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
function createSampleThread2() {
    mod = intf.newModule();
    mod.newPost({id: 1001, body:""});
    mod.newPost({id: 1002, body: ">>1001"});
    mod.newPost({id: 1005, body: ">>1002"});
    //1004
    mod.newPost({id: 1006, body: ">>1002"});
    //1014
    // 1007
    // 1004
    mod.newPost({id: 1003, body: ">>1001"});
    // 1007
    mod.newPost({id: 1009, body: ">>1003"});
    // 1011
    // 1008
    mod.newPost({id: 1004, body: ">>1001 >>1002 >>1005"});
    mod.newPost({id: 1010, body: ">>1004"});
    mod.newPost({id: 1011, body: ">>1004 >>1003"});
    // 1015
    mod.newPost({id: 1012, body: ">>1004"});
    mod.newPost({id: 1014, body: ">>1012 >>1006 >>1004"});
    mod.newPost({id: 1013, body: ">>1004"});
    mod.newPost({id: 1007, body: ">>1001 >>1002 >> 1003"});
    mod.newPost({id: 1008, body: ">>1001 >>1003 >>1014"});
    mod.newPost({id: 1015, body: ">>1008 >>1011"});
    mod.newPost({id: 1016, body: ">>1008"});

    return mod;
}

function createSampleThread3() {
    mod = intf.newModule();
    var posts = [
        {id: 1001, body:""},
        {id: 1002, body: ">>1001"},
        {id: 1005, body: ">>1002"},
        {id: 1006, body: ">>1002"},
        {id: 1003, body: ">>1001"},
        {id: 1009, body: ">>1003"},
        {id: 1004, body: ">>1001 testing >>1002 123\nmumble>>1005jumble"},
        {id: 1010, body: ">>1004"},
        {id: 1011, body: ">>1004 >>1003"},
        {id: 1012, body: ">>1004"},
        {id: 1014, body: ">>1012 >>1006 >>1004"},
        {id: 1013, body: ">>1004"},
        {id: 1007, body: ">>1001 >>1002 >> 1003"},
        {id: 1008, body: ">>1001 >>1003 >>1014"},
        {id: 1015, body: ">>1008 >>1011"},
        {id: 1016, body: ">>1008"},
    ].forEach(function(data) {
        mod.newPost(data);
    });
    return mod;
}

function createThreadFromSource(srcThread) {
    mod = intf.newModule();
    srcThread.forEach(function(data) {
        mod.newPost(data);
    });
    return mod;
}

function assertAll(list, p) {
    assert.ok(forAll(list, p));
}

function forAll(xs, p) {
    var b = 1;
    xs.forEach(function(x) {
        b = b && p(x);
    });
    return b;
}

function ids(postlist) {
    return postlist.map(function(post) { return post.id });
}

function idm(postlist) {
    return toSet(ids(postlist));
}

function toSet(list) {
    var m ={};
    list.forEach(function(x) {
        m[x] = true;
    });
    return m;
}

function linkPosts(intf, linkages) {
    linkages.forEach(function(link) {
        intf.attachToParent(intf.getPost(link[0]), intf.getPost(link[1]));
        intf.postdb.print();
        validateInn(intf);
    });
}

for (var name in test) {
    if (name.search("test") != 0)
        continue;
    console.log("*** Testing", name);
    test[name]();
}


