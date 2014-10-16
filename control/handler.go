
package control

import (
    "net/http"
    "fmt"
    "github.com/gorilla/mux"
    "nvlled/coeval/rend"
    "nvlled/coeval/sesion"
    "nvlled/coeval/fora"
    "strconv"
)

func Login(w http.ResponseWriter, r *http.Request) {
    username := "nvlled"
    sesion.SetUsername(username, w, r)
    fmt.Fprint(w, "logged in as ", username)
}

func Home(w http.ResponseWriter, r *http.Request) {
    rend.Render(w, r, sesion.Merge(r, rend.Data{}))
}

func Admin(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "admin")
}

func BoardList(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "board list")
}

func BoardPage(w http.ResponseWriter, r *http.Request) {
    u := sesion.User(r)
    pageno := mux.Vars(r)["page"]
    bid := fora.Bid(mux.Vars(r)["bid"])
    board,err := u.GetBoard(bid)
    flunk(err)
    rend.RenderRoute("board-page", w, r, setData(r, rend.Data{
        "pageno" : pageno,
        "threads" : board.GetPage(readInt(pageno, 0)),
    }))
}

func BoardCatalog(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "board catalog")
}

func BoardCreate(w http.ResponseWriter, r *http.Request) {
    rend.Render(w, r, sesion.Merge(r, rend.Data{
        "error" : sesion.FlashGet(r, "error"),
    }))
}

func SubmitBoardCreate(w http.ResponseWriter, r *http.Request) {
    u := sesion.User(r)
    bid := fora.Bid(r.FormValue("bid"))
    desc := r.FormValue("desc")

    b, err := u.NewBoard(bid,desc)
    if err != nil {
        sesion.FlashSet(w, r, "error", err)
        BoardCreate(w, r)
    } else {
        fmt.Fprint(w, "board created: ", b.Id())
    }
}

func BoardDelete(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "board delete")
}

func ThreadCreate(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "thread create")
}

func ThreadView(w http.ResponseWriter, r *http.Request) {
    bid := fora.Bid(mux.Vars(r)["bid"])
    tid := fora.Tid(mux.Vars(r)["tid"])
    user := sesion.User(r)

    board,err := user.GetBoard(bid)
    flunk(err)
    thread := board.GetThread(tid)

    rend.Render(w, r, setData(r, rend.Data{
        "thread" : thread,
    }))
}

func ThreadDelete(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "thread delete")
}

func ThreadReply(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "thread reply")
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

var fileServer = http.StripPrefix("/public", http.FileServer(http.Dir("static/public")))
func ServeStatic(w http.ResponseWriter, r *http.Request) {
    fileServer.ServeHTTP(w, r)
}

func setData(r *http.Request, data rend.Data) rend.Data {
    return sesion.Merge(r, data)
}

func flunk(err error) {
    if err != nil {
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







