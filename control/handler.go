
package control

import (
	"net/http"
	"fmt"
)

func Home(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "home")
}

func Admin(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "admin")
}

func BoardList(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "board list")
}

func BoardPage(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "board page")
}

func BoardCatalog(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "board catalog")
}

func BoardCreate(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "board create")
}

func BoardDelete(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "board delete")
}

func ThreadCreate(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "thread create")
}

func ThreadView(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "thread view")
}

func ThreadDelete(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "thread delete")
}

func ThreadReply(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "thread reply")
}

func PostView(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "post view")
}

func PostDelete(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "post delete")
}

func PostReply(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "post reply")
}


