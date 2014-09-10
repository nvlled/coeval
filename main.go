package main

import (
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"log"
	"os"
	"os/signal"
	"syscall"
	"nvlled/goeval/fora"
)

func BoardList(resp http.ResponseWriter, req *http.Request) {
	fmt.Fprintln(resp, "showing available boards in here oo")
}

func Board(resp http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	fmt.Fprintf(resp, "%s: first page", vars["bid"])
}

func Catalog(resp http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	fmt.Fprintf(resp, "%s: catalog", vars["bid"])
}

func Home(resp http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(resp,"homepage")
}

func Thread(resp http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	fmt.Fprintf(resp,"%s: Showing thread %s",
	vars["bid"], vars["tid"])
}

func makeRoutes() *mux.Router {
	root := mux.NewRouter()
	root.StrictSlash(true)

	root.HandleFunc("/", Home)
	boardRoot := root.PathPrefix("/board").Subrouter()
	board := boardRoot.PathPrefix("/{bid}").Subrouter()

	boardRoot.HandleFunc("/", BoardList).Name("boards")
	board.HandleFunc("/", Board).Name("board")
	board.HandleFunc("/catalog", Catalog).Name("catalog")

	threadRoot := board.PathPrefix("/thread").Subrouter()
	thread := threadRoot.PathPrefix("/{tid}").Subrouter()
	thread.HandleFunc("/", Thread)

	return root
}

func closeOnKill() {
	c := make(chan os.Signal, 1)
	go func() {
		for s := range c {
			fmt.Printf("You'r kill %v\n", s)
			os.Exit(1)
		}
	}()
	signal.Notify(c, syscall.SIGTERM)
}

func main() {
	routes := makeRoutes()
	url, err := routes.Get("board").URL("bid", "g")
	fmt.Printf("[%v] %v\n", err, url)
	log.Println("Server started")

	fora.NewUser("test", fora.Mod)
	fmt.Println(fora.GetUser("test"))
	//board.Create("g", "technology")
	//board.NewThread("title", "body")

	log.Fatal(http.ListenAndServe(":8080", routes))
}

