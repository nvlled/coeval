
package rend

import (
	ht "net/http"
	"github.com/gorilla/context"
	"nvlled/goeval/sesion/key"
	"nvlled/rut"
	"html/template"
)

type T func(string, interface{}, ht.ResponseWriter,  *ht.Request)

var RenderDefault = RenderHtml

// rend.Render("home", data, w, r)
func Render(name string, data interface{}, w ht.ResponseWriter, r *ht.Request) {
	render := Get(r)
	render(name, data, w, r)
}

func Get(r *ht.Request) T {
	render := context.Get(r, key.Render)
	switch render.(type) {
		case T: return render.(T)
	}
	return RenderDefault
}

//func Set(r *ht.Request) {
//	context.Set(r, key.Render, render)
//}
//
func Hook(render T) rut.Hook {
	return func(r *ht.Request) {
		context.Set(r, key.Render, render)
	}
}

var HookHtml rut.Hook = Hook(RenderHtml)
var HookJson rut.Hook = Hook(RenderJson)

func SetEnv(env map[string]interface{}) {
	htmlTempl.Funcs(template.FuncMap(env))
}

func init() {
	//env = make(template.FuncMap)
}



