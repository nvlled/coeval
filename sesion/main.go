
package sesion

import (
	ht "net/http"
	"nvlled/goeval/sesion/key"
	"github.com/gorilla/sessions"
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






