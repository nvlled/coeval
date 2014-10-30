
package fora

import (
    "math"
    "sort"
    "strconv"
    "fmt"
)

type thread struct {
    currentUser User
    id Tid
    op Post
    board Board
}

func (thread *thread) CurrentUser() User {
    return thread.currentUser
}

func (thread *thread) Id() Tid {
    return thread.id
}

func (thread *thread) Bid() Bid {
    return thread.board.Id()
}

func (thread *thread) Title() string {
    return thread.op.Title()
}

func (thread *thread) Body() string {
    return thread.op.Body()
}

func (thread *thread) Board() Board {
    return thread.board
}

func (thread *thread) Creator() User {
    return thread.GetOp().Creator()
}

func (thread *thread) GetOp() Post {
    return thread.op
}

func (thread *thread) GetPost(id Pid) Post {
    return getPost(thread, id)
}

func (thread *thread) Reply(title, body string, parentIds ...Pid) (Post, error) {
    return newPost(thread, title, body, parentIds...)
}

func (thread *thread) ReplyOn(title, body string) (Post, error) {
    parentIds := ParseIds(body)
    return thread.Reply(title, body, parentIds...)
}

func (thread *thread) GetPosts() []Post {
    u := thread.CurrentUser()
    b := thread.Board()
    posts := userStore(u).GetPosts(IdArgs{B: b.Id(), T: thread.Id()})
    sort.Sort(PostById(posts))
    posts = posts[1:] // excluding Op
    return posts
}

func (thread *thread) RecentPosts() []Post {
    u := thread.CurrentUser()
    b := thread.Board()
    posts := userStore(u).GetPosts(IdArgs{B: b.Id(), T: thread.Id()})
    sort.Sort(PostById(posts))
    posts = posts[1:] // excluding Op
    n := len(posts)
    return posts[int(math.Max(0, float64(n-5))):n]
}

func (t *thread) String() string {
    op := t.GetOp()
    return fmt.Sprintf("thread{[bid=%v, tid=%v], pid=%v, title=%v, body=%v}",
        t.Board().Id(), t.Id(), op.Id(), op.Title(), op.Body())
}

func newThread(board Board, title string, body string) (Thread, error) {
    var op *post
    var t *thread
    u := board.CurrentUser()
    op = createPost(u, title, body)
    t = &thread{
        currentUser: u,
        op: op,
        board: board,
    }

    if err := verifyPostDetails(op); err != nil {
        return nil, err
    }

    op.thread = t
    userStore(u).PersistThread(t)
    op.id = Pid(t.id)
    userStore(u).PersistPost(op)
    return t, nil
}

func getThread(board Board, tid Tid) Thread {
    u := board.CurrentUser()
    return userStore(u).GetThread(IdArgs{B: board.Id(), T: tid})
}

func getThreads(board Board) []Thread {
    u := board.CurrentUser()
    return userStore(u).GetThreads(board.Id())
}

type ThreadById []Thread

func (threads ThreadById) Len() int {
    return len(threads)
}

func (threads ThreadById) Swap(i, j int) {
    threads[i], threads[j] = threads[j], threads[i]
}

func (threads ThreadById) Less(i, j int) bool {
    x,_ := strconv.Atoi(string(threads[i].Id()))
    y,_ := strconv.Atoi(string(threads[j].Id()))
    return x < y
}



