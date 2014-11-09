
package sesion

import (
    ht "net/http"
    "nvlled/coeval/sesion/key"
    "nvlled/coeval/rend"
    "github.com/gorilla/sessions"
    "github.com/gorilla/context"
    "nvlled/coeval/fora"
    "github.com/nvlled/rule"
    "encoding/gob"
)

const (
    Name = "coeval-session"
)

type FormVal map[string]string

var store = sessions.NewCookieStore([]byte("supersecretpassword"))

func Set(w ht.ResponseWriter, r *ht.Request, key string, value interface{}) {
    s,_ := store.Get(r, Name)
    s.Values[key] = value
    s.Save(r, w)
}

func Get(r *ht.Request, key string) interface{} {
    s,_ := store.Get(r, Name)
    return s.Values[key]
}

func SetUsername(username string, w ht.ResponseWriter, r *ht.Request) {
    Set(w, r, key.Username, username)
}

func FlashSet(w ht.ResponseWriter, r *ht.Request, key string, val interface{}) {
    s, err := store.Get(r, Name)
    if err != nil { panic(err) }
    s.AddFlash(val, key)
    s.Save(r, w)
}

func FlashGetAll(w ht.ResponseWriter, r *ht.Request, key string) []interface{} {
    s, err := store.Get(r, Name)
    if err != nil { panic(err) }

    fs := s.Flashes(key)
    s.Save(r, w)
    return fs
}

func FlashGet(w ht.ResponseWriter, r *ht.Request, key string) interface{} {
    fs := FlashGetAll(w, r, key)
    n := len(fs)
    if n > 0 {
        return fs[n - 1]
    }
    return nil
}

func AddNotification(w ht.ResponseWriter, r *ht.Request, message string) {
    FlashSet(w, r, "notifications", message)
}

func GetNotifications(w ht.ResponseWriter, r *ht.Request) []interface{} {
    fs := FlashGetAll(w, r, "notifications")
    return fs
}

func SetErrors(w ht.ResponseWriter, r *ht.Request, err error) {
    FlashSet(w, r, "error", err)
}

func SaveForm(w ht.ResponseWriter, r *ht.Request, form FormVal) {
    FlashSet(w, r, "form", form)
}

func GetErrors(w ht.ResponseWriter, r *ht.Request) error {
    switch t := FlashGet(w, r, "error").(type) {
        case error: return t
    }

    return rule.Error{}
}

func GetForm(w ht.ResponseWriter, r *ht.Request) FormVal  {
    switch t := FlashGet(w, r, "form").(type) {
        case FormVal: return t
    }

    return FormVal{}
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
    data["__notifications"] = GetNotifications(w, r)
    data["__form"] = GetForm(w, r)
    data["error"] = GetErrors(w, r)
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

func init() {
    gob.Register(make(FormVal))
}




