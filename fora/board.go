package fora

type board struct {
	currentUser User
	id          Bid
	desc        string
	creator     User
	//threads map[string]*Thread
}

func (board *board) CurrentUser() User {
	return board.currentUser
}

func (board *board) Id() Bid {
	return board.id
}

func (board *board) Desc() string {
	return board.desc
}

func (board *board) Creator() User {
	return board.creator
}

func (board *board) NewThread(title string, body string) Thread {
	return newThread(board, title, body)
}

func (board *board) GetThread(tid Tid) Thread {
	return getThread(board, tid)
	//thread := Store().GetThread(tid)
	//thread.currentUser = board.currentUser()
}

func (board *board) GetThreads() []Thread {
	return getThreads(board)
}

func (board *board) GetPage(pageno int) []Thread {
	// stub, just return all threads for the mean time
	store := userStore(board.CurrentUser())
	//var threads []Thread
	return store.GetThreads(board.Id())
}

func getBoard(currentUser User, bid Bid) Board {
	return userStore(currentUser).GetBoard(bid)
}

func BoardExists(bid Bid) bool {
	return getBoard(Anonymous(), bid) != nil
}

func newBoard(creator User, bid Bid, desc string) (Board, error) {
	//if BoardExists(bid) {
	//	return nil, nil
	//}

	if creator.Kind() != Admin {
		return nil, AdminError
	}

	b := &board{
		currentUser: creator,
		id:          bid,
		desc:        desc,
		creator:     creator,
	}
	userStore(creator).PersistBoard(b)
	return b, nil
}


