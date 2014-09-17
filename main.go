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
)

var env = map[string]interface{} {
	"url" : routes.URL,
}

func main() {
	rend.SetEnv(env)
	handler := routes.Handler()
	log.Fatal(http.ListenAndServe(":7070", handler))
}




