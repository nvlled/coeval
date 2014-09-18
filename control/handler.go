
package control

import (
	"net/http"
	"fmt"
	"github.com/gorilla/context"
	"nvlled/goeval/sesion/key"
	"nvlled/goeval/rend"
	"nvlled/goeval/sesion"
)

// sesion.Add adds to the renderer data the username, etc.
func Home(w http.ResponseWriter, r *http.Request) {
	rend.Render("home", w, r, sesion.Merge(r, rend.Data{
	}))
}

func Admin(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "admin")
}

func BoardList(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "board list")
}

func BoardPage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "board page")
}

func BoardCatalog(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "board catalog")
}

func BoardCreate(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "board create")
}

func SubmitBoardCreate(w http.ResponseWriter, r *http.Request) {
}

func BoardDelete(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "board delete")
}

func ThreadCreate(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "thread create")
}

func ThreadView(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "thread view")
}

func ThreadDelete(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "thread delete")
}

func ThreadReply(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "thread reply")
}

func PostView(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "post view")
}

func PostDelete(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "post delete")
}

func PostReply(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "post reply")
}



