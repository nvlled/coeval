package main

import (
	//"fmt"
	//"github.com/gorilla/mux"
	"net/http"
	"log"
	//"os"
	//"os/signal"
	//"syscall"
	//"nvlled/goeval/fora"
	"nvlled/goeval/routes"
	"nvlled/goeval/rend"
	"nvlled/goeval/control"
)

var env = map[string]interface{} {
	"url" : routes.URL,
}

func createHandler() http.Handler {
	rend.SetEnv(env)
	handler := routes.Handler()
	handler = control.CatchError(handler)
	return handler
}

func main() {
	log.Fatal(http.ListenAndServe(":7070", createHandler()))
}



