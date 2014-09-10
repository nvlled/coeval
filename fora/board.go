package fora

type board struct {
	currentUser User
	id          bid
	desc        string
	creator     User
	//threads map[string]*Thread
}

func (board *board) CurrentUser() User {
	return board.currentUser
}

func (board *board) Id() bid {
	return board.id
}

func (board *board) Desc() string {
	return board.desc
}

func (board *board) Creator() User {
	return board.creator
}

func (board *board) NewThread(title string, body string) Thread {
	return NewThread(board, title, body)
}

func (board *board) GetThread(tid tid) Thread {
	return GetThread(board, tid)
	//thread := Store().GetThread(tid)
	//thread.currentUser = board.currentUser()
}

func (board *board) GetThreads() []Thread {
	return GetThreads(board)
}

func (board *board) GetPage(pageno int) []Thread {
	// stub, just return all threads for the mean time
	store := UserStore(board.CurrentUser())
	//var threads []Thread
	return store.GetThreads(board.Id())
}

func GetBoard(currentUser User, bid bid) Board {
	return UserStore(currentUser).GetBoard(bid)
}

func BoardExists(bid bid) bool {
	return GetBoard(Anonymous(), bid) != nil
}

func NewBoard(creator User, bid bid, desc string) Board {
	//if BoardExists(bid) {
	//	return nil, nil
	//}
	// creator must have correct privileges
	b := &board{
		currentUser: creator,
		id:          bid,
		desc:        desc,
		creator:     creator,
	}
	UserStore(creator).PersistBoard(b)
	return b
}



