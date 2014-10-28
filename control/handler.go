
package control

import (
    "net/http"
    "fmt"
    "github.com/gorilla/mux"
    "nvlled/coeval/rend"
    "nvlled/coeval/sesion"
    "nvlled/coeval/fora"
    "nvlled/coeval/urlfor"
    "strconv"
)

func Login(w http.ResponseWriter, r *http.Request) {
    username :=  r.FormValue("username")
    sesion.SetUsername(username, w, r)
    fmt.Fprint(w, "logged in as ", username)
}

func Home(w http.ResponseWriter, r *http.Request) {
    rend.Render(w, r, sesion.Merge(w, r, rend.Data{}))
}

func Admin(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "admin")
}

func BoardList(w http.ResponseWriter, r *http.Request) {
    u := sesion.User(r)
    rend.Render(w, r, sesion.Merge(w, r, rend.Data{
        "boards" : u.GetBoards(),
    }))
}

func BoardPage(w http.ResponseWriter, r *http.Request) {
    u := sesion.User(r)
    pageno := mux.Vars(r)["page"]
    bid := fora.Bid(mux.Vars(r)["bid"])
    board := u.GetBoard(bid)
    flunkNil(board, fora.BoardNotFound(bid))
    rend.RenderRoute("board-page", w, r, sesion.Merge(w, r, rend.Data{
        "bid" : bid,
        "pageno" : pageno,
        "threads" : board.GetPage(readInt(pageno, 0)),
    }))
}

func BoardCatalog(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "board catalog")
}

func BoardCreate(w http.ResponseWriter, r *http.Request) {
    rend.Render(w, r, sesion.Merge(w, r, rend.Data{
    }))
}

func SubmitBoardCreate(w http.ResponseWriter, r *http.Request) {
    u := sesion.User(r)
    bid := fora.Bid(r.FormValue("bid"))
    desc := r.FormValue("desc")

    b, err := u.NewBoard(bid,desc)
    if err != nil {
        sesion.SetErrors(w, r, err)
        BoardCreate(w, r)
    } else {
        fmt.Fprint(w, "board created: ", b.Id())
    }
}

func BoardDelete(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "board delete")
}

func ThreadCreate(w http.ResponseWriter, r *http.Request) {
    bid, _, _ := getIdsFromMuxVars(r)
    user := sesion.User(r)

    title := r.FormValue("post-title")
    body := r.FormValue("post-body")

    board := user.GetBoard(bid)
    flunkNil(board, fora.BoardNotFound(bid))

    thread, err := board.NewThread(title, body)

    if err != nil {
        returnToForm(w, r, err, sesion.FormVal{
            "title" : title,
            "body" : body,
        })
        return
    }

    w.Header().Set("Location", urlfor.Thread(thread))
    w.WriteHeader(301)
    rend.Render(w, r, sesion.Merge(w, r, rend.Data{
        "thread" : thread,
    }))
}

func ThreadView(w http.ResponseWriter, r *http.Request) {
    bid, tid, _ := getIdsFromMuxVars(r)
    user := sesion.User(r)

    board := user.GetBoard(bid)
    flunkNil(board, fora.BoardNotFound(bid))
    thread := board.GetThread(tid)

    rend.Render(w, r, sesion.Merge(w, r, rend.Data{
        "thread" : thread,
    }))
}

func ThreadDelete(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "thread delete")
}

func ThreadReply(w http.ResponseWriter, r *http.Request) {
    bid, tid, _ := getIdsFromMuxVars(r)
    user := sesion.User(r)

    title := r.FormValue("post-title")
    body  := r.FormValue("post-body")
    parentIds := fora.ParseIds(body)

    board := user.GetBoard(bid)
    flunkNil(board, fora.BoardNotFound(bid))
    thread := board.GetThread(tid)
    flunkNil(thread, fora.ThreadNotFound(tid))

    post, err := thread.Reply(title, body, parentIds...)
    //flunk(err)

    if err != nil {
        returnToForm(w, r, err, sesion.FormVal{
            "title" : title,
            "body" : body,
        })
        return
    }

    w.Header().Set("Location", urlfor.Thread(thread))
    w.WriteHeader(301)
    rend.Render(w, r, sesion.Merge(w, r, rend.Data{
        "post" : post,
    }))
}

func PostView(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "post view")
}

func PostDelete(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "post delete")
}

func PostReply(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "post reply")
}

func getIdsFromMuxVars(r *http.Request) (fora.Bid, fora.Tid, fora.Pid) {
    vars := mux.Vars(r)
    return fora.Bid(vars["bid"]),
    fora.Tid(vars["tid"]),
    fora.Pid(vars["pid"])
}

var fileServer = http.StripPrefix("/public", http.FileServer(http.Dir("static/public")))
func ServeStatic(w http.ResponseWriter, r *http.Request) {
    fileServer.ServeHTTP(w, r)
}

func flunk(err error) {
    if err != nil {
        panic(err)
    }
}

func flunkNil(obj interface{}, err error) {
    if obj == nil {
        panic(err)
    }
}

func readInt(n string, defVal int) int {
    x, err := strconv.Atoi(n)
    if err != nil {
        return defVal
    }
    return x
}

func returnToForm(w http.ResponseWriter, r *http.Request, err error, form sesion.FormVal) {
    formPath := r.FormValue("form-path")
    sesion.SetErrors(w, r, err)
    sesion.SaveForm(w, r, form)

    if formPath != "" {
        w.Header().Set("Location", formPath)
        w.WriteHeader(301)
    }

    rend.Render(w, r, sesion.Merge(w, r, rend.Data{
        "__error" : err,
    }))
}

