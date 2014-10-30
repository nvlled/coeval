package main

import (
    "fmt"
    //"github.com/gorilla/mux"
    "net/http"
    "log"
    //"os"
    //"os/signal"
    //"syscall"
    "nvlled/coeval/fora"
    "nvlled/coeval/sesion"
    "nvlled/coeval/routes"
    "nvlled/coeval/rend"
    "nvlled/coeval/control"
    "nvlled/coeval/urlfor"
)

var env = map[string]interface{} {
    "post_url" : urlfor.Post,
    "thread_url" : urlfor.Thread,
    "board_url" : urlfor.Board,
    "with_post_url" : urlfor.RouteWithPost,
    "with_thread_url" : urlfor.RouteWithThread,
    "with_board_url" : urlfor.RouteWithBoard,
    "url" : urlfor.Route,
    "str" : func(x interface{}) string {
        return fmt.Sprintf("%v", x)
    },
    "render_postlinks" : rend.RenderPostlinks,
}

func createHandler() http.Handler {
    rend.SetEnv(env)
    handler := routes.Handler()
    handler = control.CatchError(handler)
    handler = sesion.WrapResp(handler)
    return handler
}

func initMessageBoard() {
    println("initializing message board")
    user,_ := fora.NewUser("nvlled", fora.Admin)
    user.NewBoard("g", "animu hating plebs")
    user.NewBoard("a", "saten-san a sl**")
    user.NewBoard("b", "random")
    user.NewBoard("pol", "politics")
    user.NewBoard("sci", "science")

    user = fora.Anonymous()
    g := user.GetBoard("g")

    //g.NewThread("Daily purgamming thread", "What are you working /g/")
    //g.NewThread("Java thread", "What's so bad about java?")
    //g.NewThread("DPT", "What are you working on /dpt/?")
    dpt,_ := g.NewThread("Daily programming thread", "Animu edition")

    post1 := dpt.GetOp()
    post2,_ := dpt.ReplyOn("", refer(post1))
    post5,_ := dpt.ReplyOn("", refer(post2))
    post6,_ := dpt.ReplyOn("", refer(post2))
    post3,_ := dpt.ReplyOn("", refer(post1))
    post9,_ := dpt.ReplyOn("", refer(post3))
    post4,_ := dpt.ReplyOn("", refer(post1, post2, post5))
    post10,_ := dpt.ReplyOn("", refer(post4))
    post11,_ := dpt.ReplyOn("", refer(post4, post3))
    post12,_ := dpt.ReplyOn("", refer(post4))
    post14,_ := dpt.ReplyOn("", refer(post12, post6, post4))
    post13,_ := dpt.ReplyOn("", refer(post4))
    post7,_ := dpt.ReplyOn("", refer(post1, post2, post3))
    post8,_ := dpt.ReplyOn("", refer(post1, post3, post14))
    post15,_ := dpt.ReplyOn("", refer(post8, post11))
    post16,_ := dpt.ReplyOn("", refer(post8))

    println(post9, post10, post13, post7, post15, post16)
}

func refer(posts ...fora.Post) string {
    s := ""
    for _, post := range posts {
        s = fmt.Sprintf("%s>>%s\n", s, string(post.Id()))
    }
    return s
}

func main() {
    initMessageBoard()
    log.Fatal(http.ListenAndServe(":7070", createHandler()))
}
