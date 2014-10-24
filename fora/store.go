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
    GetReplyIds(ids IdArgs) []Pid
    GetParents(ids IdArgs) []Post
    GetParentIds(ids IdArgs) []Pid
    PersistPost(t *post, parentIds ...Pid) error

    GetUser(name string) User
    PersistUser(u *user) error
}

func (id IdArgs) Extract(required ...string) (Bid, Tid, Pid) {
    for _,s := range required {
        switch s {
        case "bid": if string(id.B) == "" { panic("Missing required bid arg") }
        case "tid": if string(id.T) == "" { panic("Missing required tid arg") }
        case "pid": if string(id.P) == "" { panic("Missing required pid arg") }
        }
    }
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


