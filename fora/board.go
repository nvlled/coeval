package fora

import (
    "fmt"
    "sort"
    "encoding/json"
)

type board struct {
    currentUser User
    id          Bid
    desc        string
    creator     User
}

const (
    PAGE_SIZE int = 10
)

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

func (board *board) NewThread(title string, body string) (Thread, error) {
    return newThread(board, title, body)
}

func (board *board) GetThread(tid Tid) Thread {
    return getThread(board, tid)
}

func (b *board) String() string {
    return fmt.Sprintf("board{%v, %v}", b.Id(), b.Desc())
}

func (b *board) MarshalJSON() ([]byte, error) {
    return json.Marshal(map[string]interface{}{
        "id" : b.Id(),
        "desc" : b.Desc(),
        "creator" : b.Creator().Name(),
    })
}

func (board *board) GetThreads() []Thread {
    return getThreads(board)
}

func (board *board) GetPage(pageno int) []Thread {
    store := userStore(board.CurrentUser())
    return store.GetBoardPage(board.Id(), pageno, PAGE_SIZE)
}

func getBoard(currentUser User, bid Bid) Board {
    b := userStore(currentUser).GetBoard(bid)
    return b
}

func getBoards(currentUser User) []Board {
    boards := userStore(currentUser).GetBoards()
    sort.Sort(BoardById(boards))
    return boards
}

func BoardExists(bid Bid) bool {
    b := getBoard(Anonymous(), bid)
    return b != nil
}

func newBoard(creator User, bid Bid, desc string) (Board, error) {
    if creator.Kind() != Admin {
        return nil, AdminError
    }

    b := &board{
        currentUser: creator,
        id:          bid,
        desc:        desc,
        creator:     creator,
    }

    if err := verifyBoardCreate(b); err != nil {
        return nil, err
    }

    userStore(creator).PersistBoard(b)
    return b, nil
}


type BoardById []Board

func (boards BoardById) Len() int {
    return len(boards)
}

func (boards BoardById) Swap(i, j int) {
    boards[i], boards[j] = boards[j], boards[i]
}

func (boards BoardById) Less(i, j int) bool {
    return boards[i].Id() < boards[j].Id()
}
