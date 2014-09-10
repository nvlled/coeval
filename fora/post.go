
package fora

type post struct {
	creator User
	currentUser User
	id pid
	title string
	body string
	thread Thread
	parent Post
}

func (post *post) CurrentUser() User {
	return post.currentUser
}

func (post *post) Id() pid {
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

func (post *post) HasParent() bool {
	return post.parent != nil
}

func (post *post) Parent() Post {
	return post.parent
}

func (p *post) Reply(title string, body string) Post {
	user := p.CurrentUser()
	replypost := &post{
		title: title,
		body: body,
		thread: p.Thread(),
		parent: p,
	}
	userStore(user).PersistPost(replypost) // handle error
	return replypost
}

func (p *post) Replies() []Post {
	u := p.CurrentUser()
	t := p.Thread()
	b := t.Board()
	return userStore(u).GetReplies(b.Id(), t.Id(), p.Id())
}

func createPost(creator User, title string, body string) *post {
	return &post{
		creator: creator,
		title: title,
		body: body,
	}
}

func newPost(thread Thread, title string, body string) Post {
	op := thread.GetOp()
	return op.Reply(title, body)
}

func getPost(t Thread, pid pid) Post {
	u := t.CurrentUser()
	bid := t.Board().Id()
	return userStore(u).GetPost(bid, t.Id(), pid)
}



