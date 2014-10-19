
package sesion

import (
    ht "net/http"
    "nvlled/coeval/sesion/key"
    "nvlled/coeval/rend"
    "github.com/gorilla/sessions"
    "github.com/gorilla/context"
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

func SetLastFormPath(data rend.Data) string {
    var w ht.ResponseWriter
    var r *ht.Request
    switch t := data["__resp"].(type) {
        case ht.ResponseWriter: w = t
        default: return ""
    }
    switch t := data["__req"].(type) {
        case *ht.Request: r = t
        default: return ""
    }

    FlashSet(w, r, "form-path", r.URL.Path)
    return ""
}

func LastFormPath(r *ht.Request) string {
    switch t := FlashGet(r, "form-path").(type) {
        case string: return t
    }
    return ""
}

func SetErrors(w ht.ResponseWriter, r *ht.Request, err error) {
    FlashSet(w, r, "error", err)
}

func GetErrors(data rend.Data) interface{} {
    switch t := data["error"].(type) {
        case error: return t
    }
    switch r := data["__req"].(type) {
    case *ht.Request:
        switch t := FlashGet(r, "error").(type) {
            case error: return t
        }
    }
    return rule.Error{}
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

func Merge(w ht.ResponseWriter, r *ht.Request, data rend.Data) rend.Data {
    data["__resp"] = w
    data["__req"] = r
    data["__username"] = Username(r)
    data["__user"] = context.Get(r, key.User)
    return data
}

func WrapResp(handler ht.Handler) ht.HandlerFunc {
    return func(w ht.ResponseWriter, r *ht.Request) {
        context.Set(r, "resp", w)
        handler.ServeHTTP(w, r)
    }
}

func Resp(r *ht.Request) ht.ResponseWriter {
    switch t := context.Get(r, "resp").(type) {
        case ht.ResponseWriter: return t
    }
    return nil
}


