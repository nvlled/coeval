
package rend

import (
    ht "net/http"
    "github.com/gorilla/context"
    def "github.com/nvlled/roudetef"
    "nvlled/coeval/sesion/key"
    _"html/template"
)

type Data map[string]interface{}
type T func(string, ht.ResponseWriter, *ht.Request, Data)

var RenderDefault T = RenderHtml

func RenderRoute(routeName string, w ht.ResponseWriter, r *ht.Request, data Data) {
    var render T
    pref := getPrefix(r, routeName)
    if pref != "" {
        var ok bool
        render, ok = renderMap[pref]
        if !ok {
            render = RenderDefault
        }
    } else {
        render = Get(r)
    }
    render(removePrefix(routeName), w, r, data)
}

func RenderError(w ht.ResponseWriter, r *ht.Request, data Data) {
    RenderRoute("error", w, r, data)
}

func Render(w ht.ResponseWriter, r *ht.Request, data Data) {
    var routeName string
    switch t := context.Get(r, key.RouteName).(type) {
        case string: routeName = t
    }
    println("***routename", routeName)
    RenderRoute(routeName, w, r, data)
}

func Get(r *ht.Request) T {
    render := context.Get(r, key.Render)
    switch render.(type) {
        case T: return render.(T)
    }
    return RenderDefault
}

func HasRenderer(r *ht.Request) bool {
    render := context.Get(r, key.Render)
    switch render.(type) {
        case T: return true
    }
    return false
}

func Hook(render T) def.Hook {
    return func(r *ht.Request) {
        context.Set(r, key.Render, render)
    }
}

var renderMap = map[string]T{
    "html" : RenderHtml,
    "json" : RenderJson,
}

var HookHtmlRender def.Hook = Hook(RenderHtml)
var HookJsonRender def.Hook = Hook(RenderJson)

func SetEnv(env map[string]interface{}) {
    loadTemplates(env)
}

func init() {
    //env = make(template.FuncMap)
}
