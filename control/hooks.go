
package control

import (
	ht "net/http"
	"github.com/gorilla/context"
	"nvlled/goeval/fora"
	"nvlled/goeval/rend"
	"nvlled/goeval/sesion"
	"nvlled/goeval/sesion/key"
	"nvlled/rut"
)

type handler func(ht.ResponseWriter, *ht.Request)

func AttachUser(r *ht.Request) {
	username := sesion.Username(r)
	user := fora.GetUser(username)
	if username == "" || user == nil {
		user = fora.Anonymous()
	}
	context.Set(r, key.User, user)
}

func notAdmin(r *ht.Request) bool {
	user := context.Get(r, key.User)
	switch user.(type) {
	case fora.User:
		return (user.(fora.User)).Kind() != fora.Admin
	}
	return false
}

var RequireAdmin = rut.Guard{
	Reject: notAdmin,
	Handler: func(w ht.ResponseWriter, r *ht.Request) {
		rend.Render("error", fora.AdminError, w, r)
	},
}




