package main

import (
    "fmt"
    //"github.com/gorilla/mux"
    "net/http"
    "log"
    "os"
    //"os/signal"
    //"syscall"
    "nvlled/coeval/fora"
    "nvlled/coeval/sesion"
    "nvlled/coeval/routes"
    "nvlled/coeval/rend"
    "nvlled/coeval/control"
    "nvlled/coeval/urlfor"
)

const (
    DEFAULT_PORT = "7070"
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

    g.NewThread("Daily purgamming thread", "What are you working /g/")
    g.NewThread("Java thread", "What's so bad about java?")
    g.NewThread("DPT", "What are you working on /dpt/?")
    dpt,_ := g.NewThread("Daily programming thread", "Animu edition")

    post := make(map[int]fora.Post)
    post[1] = dpt.GetOp()
    post[2],_ = dpt.ReplyOn("", refer(post[1]))
    post[5],_ = dpt.ReplyOn("", refer(post[2]))
    post[6],_ = dpt.ReplyOn("", refer(post[2]))
    post[3],_ = dpt.ReplyOn("", refer(post[1]))
    post[9],_ = dpt.ReplyOn("", refer(post[3]))
    post[4],_ = dpt.ReplyOn("", refer(post[1], post[2], post[5]))
    post[10],_ = dpt.ReplyOn("", refer(post[4]))
    post[11],_ = dpt.ReplyOn("", refer(post[4], post[3]))
    post[12],_ = dpt.ReplyOn("", refer(post[4]))
    post[14],_ = dpt.ReplyOn("", refer(post[12], post[6], post[4]))
    post[13],_ = dpt.ReplyOn("", refer(post[4]))
    post[7],_ = dpt.ReplyOn("", refer(post[1], post[2], post[3]))
    post[8],_ = dpt.ReplyOn("", refer(post[1], post[3], post[14]))
    post[15],_ = dpt.ReplyOn("", refer(post[8], post[11]))
    post[16],_ = dpt.ReplyOn("", refer(post[8]))
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
    port := os.Getenv("PORT")
    if port == "" {
        port = DEFAULT_PORT
    }
    log.Println("listening at port", port)
    log.Fatal(http.ListenAndServe(":"+port, createHandler()))
}
