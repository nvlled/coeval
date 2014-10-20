
package fora

import (
    "strconv"
)

type usermap   map[string]user
type boardmap  map[Bid]board
type threadmap map[Tid]thread
type postmap   map[Pid]post

type memstoredata struct {
    users   usermap
    boards  boardmap
    threads map[Bid]threadmap
    posts   map[Tid]postmap
    replies map[Pid][]Pid
    parents map[Pid][]Pid
}

var defaultstore memstoredata

type memstore struct {
    user User
    data *memstoredata
}

func IdGen() func() string {
    c := make(chan string, 10)
    id := 0
    go func() {
        for {
            c <- strconv.FormatInt(int64(id), 10)
            id++
        }
    }()
    return func() string {
        return <-c
    }
}

var tidGen = IdGen()
var pidGen = IdGen()

func (store *memstore) lookupBoard(bid Bid) *board {
    if b, ok := store.data.boards[bid]; ok {
        return &b
    }
    return nil
}

func (store *memstore) lookupThread(bid Bid, tid Tid) *thread {
    data := store.data
    if _, ok := data.threads[bid]; !ok {
        data.threads[bid] = make(threadmap)
    }
    t := data.threads[bid][tid]
    return &t
}

func (store *memstore) lookupPost(tid Tid, pid Pid) *post {
    data := store.data
    if _, ok := data.posts[tid]; !ok {
        data.posts[tid] = make(postmap)
    }
    p := data.posts[tid][pid]
    return &p
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
        parents: make(map[Pid][]Pid),
    }}
}

func (store *memstore) CurrentUser() User {
    return store.user
}

func (store *memstore) GetBoard(bid Bid) Board {
    board := store.lookupBoard(bid)
    if board == nil {
        return nil
    }
    board.currentUser = store.user
    return board
}

func (store *memstore) GetBoards() []Board {
    var boards []Board
    data := store.data
    for _, b := range data.boards {
        board := b
        board.currentUser = store.user
        boards = append(boards, &board)
    }
    return boards
}

func (store *memstore) PersistBoard(board *board) error {
    boards := store.data.boards
    boards[board.id] = *board
    return nil
}

func setCurrentUser(t *thread, u User) {
    t.currentUser = u
    switch p := t.op.(type) {
    case *post: p.currentUser = t.currentUser
    }
}

func (store *memstore) GetThread(ids IdArgs) Thread {
    bid, tid, _ := ids.Extract()
    t := store.lookupThread(bid, tid)
    if t == nil {
        // noooooooooo
    }
    setCurrentUser(t, store.user)
    return t
}

func (store *memstore) GetThreads(bid Bid) []Thread {
    u := store.user
    //b := store.GetBoard(bid)
    data := store.data
    var threads []Thread
    for _, t := range data.threads[bid] {
        thread := t
        setCurrentUser(&thread, u)
        threads = append(threads, &thread)
    }
    return threads
}

func (store *memstore) GetBoardPage(bid Bid, pageno int, pagesize int) []Thread {
    start := pageno * pagesize
    end := start + pagesize

    var page []Thread
    i := 0
    for _, t := range store.data.threads[bid] {
        if i < start { continue }
        if i > end     { break    }
        i++

        thread := t
        setCurrentUser(&thread, store.user)
        page = append(page, &thread)
    }
    return page
}

func (store *memstore) PersistThread(t *thread) error {
    data := store.data
    bid := t.Board().Id()
    // check if thread is valid
    if _, ok := data.threads[bid]; !ok {
        data.threads[bid] = make(threadmap)
    }
    t.id = Tid(tidGen())
    data.threads[bid][t.id] = *t
    return nil
}

func (store *memstore) GetPost(ids IdArgs) Post {
    bid, tid, pid := ids.Extract()
    if !store.threadExists(bid, tid) {
        // thread not found
    }
    post := store.lookupPost(tid, pid)
    post.currentUser = store.user
    return post
}

func (store *memstore) GetPosts(ids IdArgs) []Post {
    bid, tid, _ := ids.Extract()
    if !store.threadExists(bid, tid) {
        // thread not found, abort
    }
    data := store.data
    var posts []Post
    for _, p := range data.posts[tid] {
        post := p
        post.currentUser = store.user
        posts = append(posts, &post)
    }
    return posts
}

func (store *memstore) persistReplies(p *post, parentIds []Pid) error {
    data := store.data
    for _, parentId := range parentIds {
        replies := data.replies[parentId]
        data.replies[parentId] = append(replies, p.id)
    }
    data.parents[p.id] = parentIds
    return nil
}

func (store *memstore) PersistPost(p *post, parentIds ...Pid) error {
    data := store.data
    tid := p.Thread().Id()
    // check if thread is valid
    if _, ok := data.posts[tid]; !ok {
        data.posts[tid] = make(postmap)
    }
    p.id = Pid(pidGen())
    data.posts[tid][p.id] = *p
    store.persistReplies(p, parentIds)
    return nil
}

func (store *memstore) GetReplies(ids IdArgs) []Post {
    _, tid, pid := ids.Extract()
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

func (store *memstore) GetReplyIds(ids IdArgs) []Pid {
    _, _, pid := ids.Extract()
    data := store.data
    return data.replies[pid]
}

func (store *memstore) GetParents(ids IdArgs) []Post {
    _, tid, pid := ids.Extract()
    data := store.data
    var parents []Post
    for _, rid := range data.parents[pid] {
        rep := store.lookupPost(tid, rid)
        if rep != nil {
            parents = append(parents, rep)
        }
    }
    return parents
}

func (store *memstore) GetParentIds(ids IdArgs) []Pid {
    _, _, pid := ids.Extract()
    data := store.data
    return data.parents[pid]
}

func (store *memstore) GetUser(name string) User {
    u, ok := store.data.users[name]
    if ok {
        return &u
    }
    return nil
}

func (store *memstore) PersistUser(u *user) error {
    store.data.users[u.name] = *u
    return nil
}




