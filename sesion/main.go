
package sesion

import (
    ht "net/http"
    "nvlled/coeval/sesion/key"
    "nvlled/coeval/rend"
    "github.com/gorilla/sessions"
    "github.com/gorilla/context"
    //"strings"
    "nvlled/coeval/fora"
    "github.com/nvlled/rule"
)

const (
    Name = "coeval-session"
)

var store = sessions.NewCookieStore([]byte("supersecretpassword"))

func SetUsername(username string, w ht.ResponseWriter, r *ht.Request) {
    s,_ := store.Get(r, Name)
    s.Values[key.Username] = username
    s.Save(r, w)
}

func FlashSet(w ht.ResponseWriter, r *ht.Request, key string, val interface{}) {
    s,_ := store.Get(r, Name)
    s.AddFlash(val, key)
    s.Save(r, w)
}

func FlashGet(r *ht.Request, key string) interface{} {
    s,_ := store.Get(r, Name)
    fs := s.Flashes(key)
    if len(fs) > 0 {
        return fs[0]
    }
    return nil
}

func Username(r *ht.Request) string {
    s,_ := store.Get(r, Name)
    username := s.Values[key.Username]
    switch username.(type) {
        case string: return username.(string)
    }
    return ""
}

func User(r *ht.Request) fora.User {
    u := context.Get(r, key.User)
    switch t := u.(type) {
        case fora.User: return t
    }
    return fora.Anonymous()
}

func Merge(r *ht.Request, data rend.Data) rend.Data {
    data["__username"] = Username(r)
    data["__user"] = context.Get(r, key.User)
    if data["error"] == nil {
        data["__error"] = rule.Error{}
    }
    return data
}




