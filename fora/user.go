
package fora
import (
	"fmt"
)

type user struct {
	name string
	kind Kind
}

func (user *user) Name() string {
	return user.name
}

func (user *user) Kind() Kind {
	return user.kind
}

func (user *user) NewBoard(boardId Bid, desc string) (Board, error) {
	return newBoard(user, boardId, desc)
}

func (user *user) GetBoard(boardId Bid) Board {
	return getBoard(user, boardId)
}

func (user *user) NewUser(name string, kind Kind) User {
	return NewUser(name, kind)
}

func (user *user) String() string {
	return fmt.Sprintf("user{name=%v, %v}",
	user.name,user.kind)
}

func Anonymous() User {
	return &user{
		name: "anonymous",
		kind: Anon,
	}
}

func GetUser(name string) User {
	u := Anonymous()
	return userStore(u).GetUser(name)
}

func NewUser(name string, kind Kind) User {
	user := &user{
		name: name,
		kind: kind,
	}
	u := Anonymous()
	userStore(u).PersistUser(user)
	return user
}


