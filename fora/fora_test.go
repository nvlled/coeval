
package fora

import (
	"testing"
)

func TestUser(t *testing.T) {
	SetUserStore(newMemStore())

	admin1 := NewUser("admin1", Admin)
	admin2 := NewUser("admin2", Admin)
	anon1 := Anonymous()
	anon2 := NewUser("pleb", Anon)

	if admin1.Kind() != Admin {
		t.Error("wrong user kind")
	}
	if admin2.Kind() != Admin {
		t.Error("wrong user kind")
	}

	if anon1.Kind() != Anon {
		t.Error("wrong user kind")
	}
	if anon2.Kind() != Anon {
		t.Error("wrong user kind")
	}

	if admin1.Name() != "admin1" {
		t.Error("wrong name")
	}
	if admin2.Name() != "admin2" {
		t.Error("wrong name")
	}
	if anon1.Name() != "anonymous" {
		t.Error("wrong name")
	}
	if anon2.Name() != "pleb" {
		t.Error("wrong name")
	}
}

func TestBoardCreation(t *testing.T) {
	SetUserStore(newMemStore())

	admin := NewUser("admin", Admin)
	anon := Anonymous()

	var b Board
	b,err := admin.NewBoard("g", "animu hating plebs")
	if err != nil {
		t.Error("cannot create board", err)
	}

	if b.CurrentUser() != admin {
		t.Error("current user must be maintained")
	}
	if b.Creator().Name() != "admin" {
		t.Error("creator name is wrong")
	}

	_,err = anon.NewBoard("a", "saten-san a sl__")
	if err == nil {
		t.Error("hackered by a macfag", err)
	}

	_,err = admin.NewBoard("g", "chinktoons general")
	if err == nil {
		t.Error("board id should be unique", err)
	}
}

func TestBoardListing(t *testing.T) {
	SetUserStore(newMemStore())

	admin := NewUser("admin", Admin)
	var boards []Board
	var b Board
	b,_ = admin.NewBoard("a", "aaa"); boards = append(boards, b)
	b,_ = admin.NewBoard("b", "bbb"); boards = append(boards, b)
	b,_ = admin.NewBoard("c", "ccc"); boards = append(boards, b)

	if b.CurrentUser() != admin {
		t.Error("current user must be maintained")
	}

	var boards2 = admin.GetBoards()
	if len(boards2) != 3 {
		t.Error("board creation failed")
	}

	inconsistent := false
	for i := range boards {
		inconsistent = inconsistent || boards[i].Id() != boards2[i].Id()
	}
	if inconsistent {
		t.Error("board creation and listing is inconsistent")
	}
}




