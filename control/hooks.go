
package control

import (
	ht "net/http"
	"github.com/gorilla/context"
	def "github.com/nvlled/roudetef"
	"nvlled/coeval/fora"
	"nvlled/coeval/rend"
	"nvlled/coeval/sesion"
	"nvlled/coeval/sesion/key"
	"github.com/nvlled/rule"
	"log"
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
	user := sesion.User(r)
	return user.Kind() != fora.Admin
}

var RequireAdmin = def.Guard{
	Reject: notAdmin,
	Handler: func(w ht.ResponseWriter, r *ht.Request) {
		rend.RenderRoute("error", w, r, rend.Data{
			"error" : fora.AdminError,
		})
	},
}

func CatchError(handler ht.Handler) ht.Handler {
	return ht.HandlerFunc(func(w ht.ResponseWriter, r *ht.Request) {
		defer func() {
			if err := recover(); err != nil {
				var render = func(err interface{}) {
					rend.RenderRoute("error", w, r, rend.Data{
						"error" : err,
					})
				}
				w.WriteHeader(401);
				switch t := err.(type) {
				case rule.Error : render(t)
				case map[string]interface{}: render(t)
				case string: render(rule.AnError("__msg", t))
				default: log.Println(err)
				}
			}
		} ()
		handler.ServeHTTP(w, r)
	})
}




