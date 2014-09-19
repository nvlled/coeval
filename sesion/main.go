
package sesion

import (
	ht "net/http"
	"nvlled/goeval/sesion/key"
	"nvlled/goeval/rend"
	"github.com/gorilla/sessions"
	"github.com/gorilla/context"
	//"strings"
)

const (
	Name = "goeval-session"
)

var store = sessions.NewCookieStore([]byte("supersecretpassword"))

func Username(r *ht.Request) string {
	s,_ := store.Get(r, Name)
	username := s.Values[key.Username]
	switch username.(type) {
		case string: return username.(string)
	}
	return ""
}

func Merge(r *ht.Request, data rend.Data) rend.Data {
	data["username"] = Username(r)
	data["user"] = context.Get(r, key.User)
	return data
}



