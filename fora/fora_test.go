
package fora

import (
	"testing"
	//"fmt"
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
	for _,b1 := range boards {
		b2 := admin.GetBoard(b1.Id())
		inconsistent = inconsistent || b1.Desc() != b2.Desc()
	}
	if inconsistent {
		t.Error("board creation and listing is inconsistent")
	}
}

func TestThreadCreation(t *testing.T) {
	SetUserStore(newMemStore())

	admin := NewUser("admin", Admin)
	anon := NewUser("admin", Admin)
	admin.NewBoard("g", "animu hating plebs")
	admin.NewBoard("a", "mai waifu is best gril")

	g := anon.GetBoard("g")
	a := anon.GetBoard("a")

	title := "Daily programming bread"
	body := "What are you working on /g/?"
	dpt := g.NewThread(title, body)

	if dpt == nil {
		t.Error("thread creation failed")
	}
	if dpt.GetOp().Title() != title {
		t.Error("title is wrong:", title)
	}
	if dpt.GetOp().Body() != body {
		t.Error("body is wrong:", body)
	}

	// check if thread belongs to correct thread

	dpt2 := g.NewThread(title + " animu edition", body)
	if dpt.Id() == dpt2.Id() {
		t.Error("thread id is not unique")
	}
	if dpt.GetOp().Id() == dpt2.GetOp().Id() {
		t.Error("op id is not unique")
	}

	if len(g.GetThreads()) != 2 {
		t.Error("wrong thread count")
	}
	if len(a.GetThreads()) != 0 {
		t.Error("wrong thread count")
	}
}

func TestPosting(t *testing.T) {
	SetUserStore(newMemStore())

	admin := NewUser("admin", Admin)
	admin.NewBoard("g", "animu hating plebs")
	admin.NewBoard("a", "saten-san general")

	anon1 := Anonymous()
	anon2 := Anonymous()

	g := anon1.GetBoard("g")
	dpt := g.NewThread("Daily sh?tposting thread", "What are you working on /g/?")
	g = anon2.GetBoard("g")
	dpt2 := g.GetThread(dpt.Id())

	if dpt.Id() != dpt2.Id() {
		t.Error("thread fetching failed")
	}

	if dpt.CurrentUser() != anon1 {
		t.Error("current user is not maintained")
	}
	if dpt2.CurrentUser() != anon2 {
		t.Error("current user is not maintained")
	}

	post1:= dpt.Reply("sage", "Op is not using an animu pic")
	post2:= dpt2.Reply("nope", "Rewriting the kernel in gentoo")

	if post1 == nil || post2 == nil {
		t.Error("failed to post in a thread")
	}

	// GetPosts include OP
	if len(dpt.GetPosts()) != 3 {
		t.Error("reply count is wrong")
	}
	if len(dpt2.GetPosts()) != 3 {
		t.Error("reply count is wrong")
	}

	if post1.Parent().Id() != dpt.GetOp().Id() {
		t.Error("op is misparented")
	}
	if post2.Parent().Id() != dpt.GetOp().Id() {
		t.Error("op is misparented")
	}

	post3 := post1.Reply("no", "no")
	post4 := post3.Reply("yes", "no you")
	post5 := post1.Reply("", "weaaboo scum git the fukt >>out")

	if len(post1.Replies()) != 2 {
		t.Error("reply count is wrong")
	}

	if post3.Parent().Id() != post1.Id() {
		t.Error("post is misparented")
	}
	if post4.Parent().Id() != post3.Id() {
		t.Error("post is misparented")
	}
	if post5.Parent().Id() != post1.Id() {
		t.Error("post is misparented")
	}

	if len(dpt.GetPosts()) != 6 {
		t.Error("wrong post count in thread")
	}
	if len(dpt2.GetPosts()) != 6 {
		t.Error("wrong post count in thread")
	}
	if len(post3.Replies()) != 1 {
		t.Error("wrong reply count")
	}

}

func TestValidation(t *testing.T) {
}



