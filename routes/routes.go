
package routes

import (
	"net/http"
	"nvlled/rut"
	"github.com/gorilla/mux"
	"github.com/gorilla/context"
	"nvlled/goeval/rend"
	"nvlled/goeval/sesion/key"
	ct "nvlled/goeval/control"
)

var GET = rut.GET
var POST = rut.POST
var group = rut.Group

var routeDef = rut.Route(
	"/", ct.Home, "home",
	rut.Hooks(rend.HookHtmlRender, ct.AttachUser),
	rut.Guards(),
	rut.SRoute("/login", ct.Login, "login"),

	rut.Route(
		"/admin", ct.Admin, "admin",
		rut.Hooks(ct.AttachUser),
		rut.Guards(ct.RequireAdmin),
		rut.SRoute("/board/create",
		rut.Ts{
			group(GET,	rut.H(ct.BoardCreate)),
			group(POST, rut.H(ct.SubmitBoardCreate)),
		}, "board-create"),
		//rut.SRoute("/board/create", group(GET,	rut.H(ct.BoardCreate)),       "board-create"),
		//rut.SRoute("/board/create", group(POST, rut.H(ct.SubmitBoardCreate)), "board-submit-create"),

	),

	rut.SRoute(
		"/board/{bid}", ct.BoardPage, "1st-board-page",

		rut.SRoute("/page/{page}",	ct.BoardPage,	 "board-page"),
		rut.SRoute("/catalog",	ct.BoardCatalog, "board-catalog"),
		rut.SRoute("/delete",		ct.BoardDelete,  "board-delete"),
		rut.SRoute("/new-thread",	ct.ThreadCreate, "thread-create"),

		rut.SRoute(
			"/thread/{tid}",	 ct.ThreadView,	  "thread-view",
			rut.SRoute("delete", ct.ThreadDelete, "thread-delete"),
			rut.SRoute("reply",  ct.ThreadReply,  "thread-reply"),
			rut.SRoute(
				"/post/{pid}",		  ct.PostView,	 "post-view",
				rut.SRoute("/delete", ct.PostDelete, "post-delete"),
				rut.SRoute("/reply",  ct.PostReply,	 "post-reply"),
			),
		),
	),
)

var routes *mux.Router

func URL(name string, params ...string) string {
	r := routes.Get(name)
	if r != nil {
		url, err := r.URL(params...)
		if err != nil {
			return "URL("+err.Error()+")"
		}
		return url.String()
	}
	return "URL(not found)"
}

func Handler() http.Handler {
	return routes
}

func init() {
	// inject route name on the context
	routeDef.MapRoute(func(def *rut.RouteDef) {
		def.AddTransformer(rut.TransformerFunc(func(r *mux.Route) {
			rut.Attach(r, func(req *http.Request) {
				context.Set(req, key.RouteName, def.Name())
			})
		}))
	})

	println("Defining routes...")
	routeDef.Print()
	println()
	root := mux.NewRouter()
	root.StrictSlash(true)
	routes = rut.BuildRouter(routeDef, root)
}







