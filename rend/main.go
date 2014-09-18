
package rend

import (
	ht "net/http"
	"github.com/gorilla/context"
	"nvlled/goeval/sesion/key"
	"nvlled/rut"
	_"html/template"
)

type Data map[string]interface{}
type T func(string, ht.ResponseWriter, *ht.Request, Data)

var RenderDefault T = RenderHtml

// rend.Render("home", data, w, r)
func Render(name string, w ht.ResponseWriter, r *ht.Request, data Data) {
	render := Get(r)
	render(name, w, r, data)
}

func Get(r *ht.Request) T {
	render := context.Get(r, key.Render)
	switch render.(type) {
		case T: return render.(T)
	}
	return RenderDefault
}

func Hook(render T) rut.Hook {
	return func(r *ht.Request) {
		context.Set(r, key.Render, render)
	}
}

var HookHtmlRender rut.Hook = Hook(RenderHtml)
var HookJsonRender rut.Hook = Hook(RenderJson)

func SetEnv(env map[string]interface{}) {
	loadTemplates(env)
}

func init() {
	//env = make(template.FuncMap)
}



