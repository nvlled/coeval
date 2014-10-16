package fora

import (
)

type Kind int
const (
    Admin Kind = iota
    Mod
    Anon
)

func (k Kind) String() string {
    switch k {
    case Admin: return "Admin"
    case Mod: return "Mod"
    case Anon: return "Anonymous"
    }
    return "---"
}

type Bid string
type Tid string
type Pid string

type User interface {
    Name() string
    Kind() Kind
    NewUser(name string, kind Kind) User
    NewBoard(boardId Bid, desc string) (Board, error)
    GetBoard(boardId Bid) (Board, error)
    GetBoards() []Board
}

type UserContainer interface {
    // current should never return nil
    CurrentUser() User
}

type Board interface {
    UserContainer
    Id() Bid
    Desc() string
    Creator() User
    NewThread(title string, body string) Thread
    GetThread(tid Tid) Thread
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
    Id() Tid
    Board() Board
    Creator() User
    GetOp() Post
    GetPost(pid Pid) Post
    Reply(title string, body string) Post
    GetPosts() []Post
    RecentPosts() []Post
}

type Post interface {
    UserContainer
    PostData
    Id() Pid
    Thread() Thread
    Creator() User
    Reply(title string, body string) Post
    Replies() []Post
    ReplyIds() []Pid

    Parents() []Post
    ParentIds() []Pid
}

//func BoardExists(bid bid) bool{ }
//func GetBoard(bid bid) *Board{ }
//func GetThread(tid tid) *Thread{ }
//func GetPost(pid pid) *Post{ }


