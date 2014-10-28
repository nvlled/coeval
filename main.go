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
    g,_ := user.NewBoard("g", "animu hating plebs")
    user.NewBoard("a", "saten-san a sl**")

    g.NewThread("Daily purgamming thread", "What are you working /g/")
    g.NewThread("Java thread", "What's so bad about java?")
    g.NewThread("DPT", "What are you working on /dpt/?")
    dpt,_ := g.NewThread("Daily programming thread", "Animu edition")

    i := 0
    for i < 100 {
        dpt.Reply(fmt.Sprintf("Reply %v", i), "12345")
        i++
    }
}

func main() {
    initMessageBoard()
    log.Fatal(http.ListenAndServe(":7070", createHandler()))
}




