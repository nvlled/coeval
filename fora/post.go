
package fora

import (
    "strconv"
)

// TODO: Make userStore take a UserContainer argument instead

type post struct {
    creator User
    currentUser User
    id Pid
    title string
    body string
    thread Thread
}

func (post *post) CurrentUser() User {
    return post.currentUser
}

func (post *post) Id() Pid {
    return post.id
}

func (post *post) Title() string {
    return post.title
}

func (post *post) Body() string {
    return post.body
}

func (post *post) Thread() Thread {
    return post.thread
}

func (post *post) Creator() User {
    return post.creator
}

func (post *post) Parents() []Post {
    u := post.CurrentUser()
    return userStore(u).GetParents(toIdArgs(post))
}

func (post *post) ParentIds() []Pid {
    u := post.CurrentUser()
    return userStore(u).GetParentIds(toIdArgs(post))
}

func (post *post) HasParent() bool {
    u := post.CurrentUser()
    return userStore(u).GetParentIds(toIdArgs(post)) != nil
}

func (p *post) Reply(title, body string, parentIds ...Pid) Post {
    user := p.CurrentUser()
    replypost := &post{
        creator: user,
        title: title,
        body: body,
        thread: p.Thread(),
    }
    if parentIds == nil {
        parentIds = []Pid{p.Id()}
    }
    userStore(user).PersistPost(replypost, parentIds...) // handle error
    return replypost
}

func (p *post) Replies() []Post {
    u := p.CurrentUser()
    t := p.Thread()
    b := t.Board()
    return userStore(u).GetReplies(IdArgs{b.Id(), t.Id(), p.Id()})
}

func (post *post) ReplyIds() []Pid {
    u := post.CurrentUser()
    return userStore(u).GetReplyIds(toIdArgs(post))
}

func createPost(creator User, title string, body string) *post {
    return &post{
        currentUser: creator,
        creator: creator,
        title: title,
        body: body,
    }
}

func newPost(thread Thread, title, body string, parentIds ...Pid) Post {
    op := thread.GetOp()
    return op.Reply(title, body, parentIds...)
}

func getPost(t Thread, pid Pid) Post {
    u := t.CurrentUser()
    bid := t.Board().Id()
    return userStore(u).GetPost(IdArgs{bid, t.Id(), pid})
}

func toIdArgs(post Post) IdArgs {
    t := post.Thread()
    return IdArgs{
        B: t.Board().Id(),
        T: t.Id(),
        P: post.Id(),
    }
}

// implement sort interface
type PostById []Post

func (posts PostById) Len() int {
    return len(posts)
}

func (posts PostById) Swap(i, j int) {
    posts[i], posts[j] = posts[j], posts[i]
}

func (posts PostById) Less(i, j int) bool {
    x,_ := strconv.Atoi(string(posts[i].Id()))
    y,_ := strconv.Atoi(string(posts[j].Id()))
    return x < y
}
