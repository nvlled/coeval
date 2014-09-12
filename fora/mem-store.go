
package fora

type usermap   map[string]*user
type boardmap  map[Bid]*board
type threadmap map[Tid]*thread
type postmap   map[Pid]*post

type memstoredata struct {
	users	usermap
	boards	boardmap
	threads map[Bid]threadmap
	posts	map[Tid]postmap
	replies map[Pid][]Pid
}

var defaultstore memstoredata

type memstore struct {
	user User
	data *memstoredata
}

func (store *memstore) lookupBoard(bid Bid) *board {
	return store.data.boards[bid]
}

func (store *memstore) lookupThread(bid Bid, tid Tid) *thread {
	data := store.data
	if _, ok := data.threads[bid]; !ok {
		data.threads[bid] = make(threadmap)
	}
	return data.threads[bid][tid]
}

func (store *memstore) lookupPost(tid Tid, pid Pid) *post {
	data := store.data
	if _, ok := data.posts[tid]; !ok {
		data.posts[tid] = make(postmap)
	}
	return data.posts[tid][pid]
}

func (store *memstore) threadExists(bid Bid, tid Tid) bool {
	return store.lookupThread(bid, tid) != nil
}

func (store *memstore) postExists(bid Bid, tid Tid, pid Pid) bool {
	return store.lookupThread(bid, tid) != nil && store.lookupPost(tid, pid) != nil
}

func (store *memstore) New(user User) Store {
	return &memstore{
		user: user,
		data: store.data,
	}
}

func newMemStore() Store {
	return &memstore{data: &memstoredata{
		users:   make(usermap),
		boards:  make(boardmap),
		threads: make(map[Bid]threadmap),
		posts:   make(map[Tid]postmap),
		replies: make(map[Pid][]Pid),
	}}
}

func (store *memstore) CurrentUser() User {
	return store.user
}

func (store *memstore) GetBoard(bid Bid) Board {
	board := store.lookupBoard(bid)
	if board != nil {
		board.currentUser = store.user
	} else {
		// freak out
	}
	return board
}

func (store *memstore) GetBoards() []Board {
	var boards []Board
	data := store.data
	for _, b := range data.boards {
		b.currentUser = store.user
		boards = append(boards, b)
	}
	return boards
}

func (store *memstore) PersistBoard(board *board) error {
	boards := store.data.boards
	boards[board.id] = board
	return nil
}

func (store *memstore) GetThread(bid Bid, tid Tid) Thread {
	t := store.lookupThread(bid, tid)
	if t == nil {
		// noooooooooo
	}
	t.currentUser = store.user
	return t
}

func (store *memstore) GetThreads(bid Bid) []Thread {
	u := store.user
	//b := store.GetBoard(bid)
	data := store.data
	var threads []Thread
	for _, t := range data.threads[bid] {
		t.currentUser = u
		threads = append(threads, t)
	}
	return threads
}

func (store *memstore) PersistThread(t *thread) error {
	data := store.data
	bid := t.Board().Id()
	// check if thread is valid
	if _, ok := data.threads[bid]; !ok {
		data.threads[bid] = make(threadmap)
	}
	data.threads[bid][t.id] = t
	return nil
}

func (store *memstore) GetPost(bid Bid, tid Tid, pid Pid) Post {
	if !store.threadExists(bid, tid) {
		// thread not found
	}
	post := store.lookupPost(tid, pid)
	post.currentUser = store.user
	return post
}

func (store *memstore) GetReplies(bid Bid, tid Tid, pid Pid) []Post {
	//t := store.lookupThread(bid, tid)
	// check for existence
	// too expensive?
	data := store.data
	var replies []Post
	for _, rid := range data.replies[pid] {
		rep := store.lookupPost(tid, rid)
		if rep != nil {
			replies = append(replies, rep)
		}
	}
	return replies
}

func (store *memstore) GetPosts(bid Bid, tid Tid) []Post {
	if !store.threadExists(bid, tid) {
		// thread not found, abort
	}
	data := store.data
	var posts []Post
	for _, p := range data.posts[tid] {
		p.currentUser = store.user
		posts = append(posts, p)
	}
	return posts
}

func (store *memstore) persistReplies(p *post) error {
	data := store.data
	if p.HasParent() {
		id := p.Parent().Id()
		r := data.replies[id]
		data.replies[id] = append(r, p.id)
	}
	return nil
}

func (store *memstore) PersistPost(p *post) error {
	data := store.data
	tid := p.Thread().Id()
	// check if thread is valid
	if _, ok := data.posts[tid]; !ok {
		data.posts[tid] = make(postmap)
	}
	data.posts[tid][p.id] = p
	store.persistReplies(p)
	return nil
}

func (store *memstore) GetUser(name string) User {
	return store.data.users[name]
}

func (store *memstore) PersistUser(u *user) error {
	store.data.users[u.name] = u
	return nil
}



