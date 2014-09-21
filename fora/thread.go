
package fora

type thread struct {
	currentUser User
	id Tid
	op Post
	board Board
	//posts map[string]*Thread
}

func (thread *thread) CurrentUser() User {
	return thread.currentUser
}

func (thread *thread) Id() Tid {
	return thread.id
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

func (thread *thread) Reply(title string, body string) Post {
	return newPost(thread, title, body)
}

func (thread *thread) Replies() []Post {
	u := thread.CurrentUser()
	b := thread.Board()
	return userStore(u).GetPosts(b.Id(), thread.Id())
}

func newThread(board Board, title string, body string) Thread {
	var op *post
	var t *thread
	u := board.CurrentUser()
	op = createPost(u, title, body)
	t = &thread{
		currentUser: u,
		op: op,
		board: board,
	}
	op.thread = t
	userStore(u).PersistThread(t)
	userStore(u).PersistPost(op)
	return t
}

func getThread(board Board, tid Tid) Thread {
	u := board.CurrentUser()
	return userStore(u).GetThread(board.Id(), tid)
}

func getThreads(board Board) []Thread {
	u := board.CurrentUser()
	return userStore(u).GetThreads(board.Id())
}



