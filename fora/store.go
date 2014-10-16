package fora

var activeStore Store

type IdArgs struct {
    B Bid
    T Tid
    P Pid
}

type Store interface {
    New(user User) Store
    CurrentUser() User

    GetBoard(bid Bid) Board
    GetBoards() []Board
    PersistBoard(*board) error
    GetBoardPage(bid Bid, pageno int, pagesize int) []Thread

    GetThread(ids IdArgs) Thread
    GetThreads(bid Bid) []Thread
    PersistThread(t *thread) error

    GetPost(ids IdArgs) Post
    GetReplies(ids IdArgs) []Post
    GetPosts(ids IdArgs) []Post
    PersistPost(t *post) error

    GetUser(name string) User
    PersistUser(u *user) error
}

func (id IdArgs) Extract() (Bid, Tid, Pid) {
    return id.B, id.T, id.P
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


