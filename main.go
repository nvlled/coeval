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
    "nvlled/coeval/routes"
    "nvlled/coeval/rend"
    "nvlled/coeval/control"
)

var env = map[string]interface{} {
    "url" : routes.URL,
    "str" : func(x interface{}) string {
        return fmt.Sprintf("%v", x)
    },
}

func createHandler() http.Handler {
    rend.SetEnv(env)
    handler := routes.Handler()
    handler = control.CatchError(handler)
    return handler
}

func initMessageBoard() {
    println("initializing message board")
    user := fora.NewUser("nvlled", fora.Admin)
    g,_ := user.NewBoard("g", "animu hating plebs")
    user.NewBoard("a", "saten-san a sl**")

    g.NewThread("Daily purgamming thread", "What are you working /g/")
    g.NewThread("Java thread", "What's so bad about java?")
    g.NewThread("DPT", "What are you working on /dpt/?")
    dpt := g.NewThread("Daily programming thread", "Animu edition")

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



