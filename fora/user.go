
package fora

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

func (user *user) NewBoard(boardId bid, desc string) Board {
	return NewBoard(user, boardId, desc)
}

func (user *user) GetBoard(boardId bid) Board {
	return GetBoard(user, boardId)
}

func (user *user) NewUser(name string, kind Kind) User {
	//if kind != Anon user.Kind() == Admin &&
	return NewUser(name, kind)
}

func Anonymous() User {
	return &user{
		name: "anonymous",
		kind: Anon,
	}
}

func GetUser(name string) User {
	u := Anonymous()
	return UserStore(u).GetUser(name)
}

func NewUser(name string, kind Kind) User {
	user := &user{
		name: name,
		kind: kind,
	}
	u := Anonymous()
	UserStore(u).PersistUser(user)
	return user
}




