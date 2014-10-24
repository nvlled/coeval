
package fora

import (
    "strconv"
    "fmt"
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

func (post *post) Tid() Tid {
    return post.thread.Id()
}

func (post *post) Bid() Bid {
    return post.thread.Board().Id()
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

func (p *post) Reply(title, body string, parentIds ...Pid) (Post, error) {
    user := p.CurrentUser()
    replypost := &post{
        creator: user,
        title: title,
        body: body,
        thread: p.Thread(),
    }

    if err := verifyPostDetails(replypost); err != nil {
        return nil, err
    }

    store := userStore(user)
    if parentIds == nil {
        parentIds = []Pid{p.Id()}
    } else {
        parentIds = filterValidPostIds(store, p.Thread().Id(), parentIds)
    }
    store.PersistPost(replypost, parentIds...)
    return replypost, nil
}

func filterValidPostIds(store Store, tid Tid, postIds []Pid) []Pid {
    var filtered []Pid
    for _,id := range postIds {
        if store.GetPost(IdArgs{P: id, T: tid}) != nil {
            filtered = append(filtered, id)
        } else {
            println("shit>", id)
        }
    }
    return filtered
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

func (post *post) IsParentOf(child Post) bool {
    pids := child.ParentIds()
    for _,id := range pids {
        if post.Id() == id {
            return true
        }
    }
    return false
}

func (post *post) IsChildOf(parent Post) bool {
    return parent.IsParentOf(post)
}

func (p *post) String() string {
    t := p.Thread()
    return fmt.Sprintf("post{[bid=%v, tid=%v], id=%v, title=%v, body=%v}",
        t.Board().Id(), t.Id(), p.Id(), p.Title(), p.Body())
}

func createPost(creator User, title string, body string) *post {
    return &post{
        currentUser: creator,
        creator: creator,
        title: title,
        body: body,
    }
}

func newPost(thread Thread, title, body string, parentIds ...Pid) (Post, error) {
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
