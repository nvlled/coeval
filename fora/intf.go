package fora

type Kind int
const (
	Admin Kind = iota
	Mod
	Anon
)

type bid string
type tid string
type pid string

type User interface {
	Name() string
	Kind() Kind
	NewUser(name string, kind Kind) User
	NewBoard(boardId bid, desc string) Board
	GetBoard(boardId bid) Board
}

type UserContainer interface {
	CurrentUser() User
}

type Board interface {
	UserContainer
	Id() bid
	Desc() string
	Creator() User
	NewThread(title string, body string) Thread
	GetThread(tid tid) Thread
	GetThreads() []Thread
	GetPage(page int) []Thread
}

type PostData interface {
	Title() string
	Body() string
}

type Thread interface {
	UserContainer
	PostData
	Id() tid
	Board() Board
	Creator() User
	GetOp() Post
	GetPost(pid pid) Post
	Reply(title string, body string) Post
	Replies() []Post
}

type Post interface {
	UserContainer
	PostData
	Id() pid
	Thread() Thread
	Creator() User
	//Delete()
	Parent() Post
	Reply(title string, body string) Post
	Replies() []Post
}

//func BoardExists(bid bid) bool{ }
//func GetBoard(bid bid) *Board{ }
//func GetThread(tid tid) *Thread{ }
//func GetPost(pid pid) *Post{ }






