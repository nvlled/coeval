package fora

var activeStore Store

type Store interface {
	New(user User) Store
	CurrentUser() User

	GetBoard(bid Bid) Board
	GetBoards() []Board
	PersistBoard(*board) error
	GetBoardPage(bid Bid, pageno int, pagesize int) []Thread

	GetThread(bid Bid, tid Tid) Thread
	GetThreads(bid Bid) []Thread
	PersistThread(t *thread) error

	GetPost(bid Bid, tid Tid, pid Pid) Post
	GetReplies(bid Bid, tid Tid, pid Pid) []Post
	GetPosts(bid Bid, tid Tid) []Post
	PersistPost(t *post) error

	GetUser(name string) User
	PersistUser(u *user) error
}

func userStore(user User) Store {
	return activeStore.New(user)
}

func SetUserStore(store Store) {
	activeStore = store
}

func init() {
	SetUserStore(newMemStore())
}




