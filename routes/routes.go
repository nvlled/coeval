
package routes

import (
	"net/http"
	"net/url"
	def "github.com/nvlled/roudetef"
	"github.com/gorilla/mux"
	"github.com/gorilla/context"
	"nvlled/coeval/rend"
	"nvlled/coeval/sesion/key"
	ct "nvlled/coeval/control"
	"fmt"
	"log"
)

var GET = def.GET
var POST = def.POST
var group = def.Group

var routeDef = def.Route(
	"/", ct.Home, "home",
	def.Hooks(rend.HookHtmlRender, ct.AttachUser),
	def.Guards(),
	def.SRoute("/login", ct.Login, "login"),

	def.Route(
		"/admin", ct.Admin, "admin",
		def.Hooks(ct.AttachUser),
		def.Guards(ct.RequireAdmin),
		def.SRoute("/board/create",
		def.Ts{
			group(GET,	def.H(ct.BoardCreate)),
			group(POST, def.H(ct.SubmitBoardCreate)),
		}, "board-create"),
		//def.SRoute("/board/create", group(GET,	def.H(ct.BoardCreate)),       "board-create"),
		//def.SRoute("/board/create", group(POST, def.H(ct.SubmitBoardCreate)), "board-submit-create"),

	),

	def.SRoute(
		"/board/{bid}", ct.BoardPage, "1st-board-page",

		def.SRoute("/page/{page}",	ct.BoardPage,	 "board-page"),
		def.SRoute("/catalog",	ct.BoardCatalog, "board-catalog"),
		def.SRoute("/delete",		ct.BoardDelete,  "board-delete"),
		def.SRoute("/new-thread",	ct.ThreadCreate, "thread-create"),

		def.SRoute(
			"/thread/{tid}",	 ct.ThreadView,	  "thread-view",
			def.SRoute("delete", ct.ThreadDelete, "thread-delete"),
			def.SRoute("reply",  ct.ThreadReply,  "thread-reply"),
			def.SRoute(
				"/post/{pid}",		  ct.PostView,	 "post-view",
				def.SRoute("/delete", ct.PostDelete, "post-delete"),
				def.SRoute("/reply",  ct.PostReply,	 "post-reply"),
			),
		),
	),
)

var routes *mux.Router

func URL(name string, params ...string) string {
	r := routes.Get(name)
	if r != nil {
		urlpath, err := r.URL(params...)
		if err != nil {
			log.Println(err.Error())
			return url.QueryEscape(fmt.Sprint("(%s)", err.Error()))
		}
		return urlpath.String()
	}
	return url.QueryEscape(fmt.Sprint("(invalid route name)"))
}

func Handler() http.Handler {
	return routes
}

func init() {
	// inject route name on the context
	routeDef.MapRoute(func(d *def.RouteDef) {
		d.AddTransformer(def.TransformerFunc(func(r *mux.Route) {
			def.Attach(r, func(req *http.Request) {
				context.Set(req, key.RouteName, d.Name())
			})
		}))
	})

	println("Defining routes...")
	routeDef.Print()
	println()
	root := mux.NewRouter()
	root.StrictSlash(true)
	routes = def.BuildRouter(routeDef, root)
}



