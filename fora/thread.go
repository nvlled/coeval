
package fora

type thread struct {
	currentUser User
	id tid
	op Post
	board Board
	//posts map[string]*Thread
}

func (thread *thread) CurrentUser() User {
	return thread.currentUser
}

func (thread *thread) Id() tid {
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

func (thread *thread) GetPost(id pid) Post {
	return GetPost(thread, id)
}

func (thread *thread) Reply(title string, body string) Post {
	return NewPost(thread, title, body)
}

func (thread *thread) Replies() []Post {
	u := thread.CurrentUser()
	b := thread.Board()
	return UserStore(u).GetPosts(b.Id(), thread.Id())
}

func NewThread(board Board, title string, body string) Thread {
	var op *post
	var t *thread
	u := board.CurrentUser()
	op = CreatePost(u, title, body)
	t = &thread{
		currentUser: u,
		op: op,
		board: board,
	}
	op.thread = t
	UserStore(u).PersistThread(t)
	return t
}

func GetThread(board Board, tid tid) Thread {
	u := board.CurrentUser()
	return UserStore(u).GetThread(board.Id(), tid)
}

func GetThreads(board Board) []Thread {
	u := board.CurrentUser()
	return UserStore(u).GetThreads(board.Id())
}




