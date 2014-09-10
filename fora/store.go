package fora

var activeStore Store

type Store interface {
	New(user User) Store
	CurrentUser() User

	GetBoard(bid bid) Board
	GetBoards() []Board
	PersistBoard(*board) error

	GetThread(bid bid, tid tid) Thread
	GetThreads(bid bid) []Thread
	PersistThread(t *thread) error

	GetPost(bid bid, tid tid, pid pid) Post
	GetReplies(bid bid, tid tid, pid pid) []Post
	GetPosts(bid bid, tid tid) []Post
	PersistPost(t *post) error

	GetUser(name string) User
	PersistUser(u *user) error
}

func UserStore(user User) Store {
	return activeStore.New(user)
}

func init() {
	activeStore = NewMemStore()
}




