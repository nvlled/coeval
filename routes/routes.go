
package routes

import (
    "net/http"
    "net/url"
    def "github.com/nvlled/roudetef"
    "github.com/gorilla/mux"
    "github.com/gorilla/context"
    "nvlled/coeval/rend"
    "nvlled/coeval/common"
    "nvlled/coeval/sesion/key"
    ct "nvlled/coeval/control"
    "nvlled/coeval/urlfor"
    "fmt"
    "log"
)

var GET = def.GET
var POST = def.POST

var routeDef = def.Route(
    "/", ct.Home, "home",
    def.Hooks(rend.HookHtmlRender, ct.AttachUser),

    def.Guards(),
    def.SRoute("/login", ct.Login, "login"),

    def.Route(
        "/admin", ct.Admin, "admin",
        def.Hooks(ct.AttachUser),
        def.Guards(ct.RequireAdmin),

        def.SRoute(GET("/board/create"), ct.BoardCreate,       "board-create"),
        def.SRoute(POST("/board/create"), ct.SubmitBoardCreate, "board-submit-create"),
    ),

    def.SRoute("/board/list", ct.BoardList, "board-list"),
    def.SRoute(
        "/board/{bid}", ct.BoardPage, "board-view",

        def.SRoute("/page/{page}",    ct.BoardPage,     "board-page"),
        def.SRoute("/catalog",        ct.BoardCatalog, "board-catalog"),
        def.SRoute("/delete",        ct.BoardDelete,  "board-delete"),
        def.SRoute("/new-thread",    ct.ThreadCreate, "thread-create"),

        def.SRoute(
            "/thread/{tid}",     ct.ThreadView,      "thread-view",
            def.SRoute("/delete", ct.ThreadDelete, "thread-delete"),
            def.SRoute("/reply",  ct.ThreadReply,  "thread-reply"),
            def.SRoute(
                "/post/{pid}",          ct.PostView,     "post-view",
                def.SRoute("/delete", ct.PostDelete, "post-delete"),
                def.SRoute("/reply",  ct.PostReply,     "post-reply"),
            ),
        ),
    ),

    def.SRoute("/public", ct.ServeStatic, "serve-static"),
    //def.SRoute(
    //    "/4chan", ct.ChanThread, "chan-index",
    //    def.SRoute("/testdata",    ct.ChanThread, "chan-thread"),
    //    def.SRoute("/{bid}/{tid}", ct.ChanThread, "chan-thread"),
    //),
)

var routes *mux.Router

var customUrlMap = map[string]func(name string, params ...string) string {
    "post-view" : func(_ string, params ...string)string {
        pid, ok := common.ToMap(params...)["pid"]
        if !ok { panic("missing arg: pid") }
        url := createUrl("thread-view", params...)
        return url+"#p"+pid
    },
}

func UrlFor(name string, params ...string) string {
    if urlmap, ok := customUrlMap[name]; ok {
        return urlmap(name, params...)
    }
    return createUrl(name, params...)
}

func createUrl(name string, params ...string) string {
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
    routeDef.Iter(func(d *def.RouteDef) {
        // inject route name on the context
        d.AddTransformer(def.TransformerFunc(func(r *mux.Route) {
            def.Attach(r, func(req *http.Request) {
                context.Set(req, key.RouteName, d.Name)
            })
        }))
        // Do the wrapping here to
        // let the error handler access the context
        // before it is cleared.
        d.Handler = ct.CatchError(d.Handler)
    })

    println("Defining routes...")
    routeDef.Print()
    println()
    root := mux.NewRouter()
    root.StrictSlash(true)
    routes = def.BuildRouter(routeDef, root)
    urlfor.SetUrlMaker(UrlFor)
}
