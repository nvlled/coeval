
package rend

import (
    "regexp"
    "bytes"
    "html/template"
    "nvlled/coeval/fora"
    "nvlled/coeval/urlfor"
    "nvlled/coeval/sesion/key"
    "github.com/nvlled/roudetef"
    "github.com/gorilla/context"
    "strings"
    ht "net/http"
)

const (
    ID_PREFIX = ">>"
)

func RenderPostlinks(post fora.Post) template.HTML {
    idRe := regexp.MustCompile(ID_PREFIX+`\d+`)
    re := regexp.MustCompile(`\x00\x00\d+|\n`)

    bs := idRe.ReplaceAllFunc([]byte(post.Body()), func(bytes []byte) []byte {
        // replace ID_PREFIX with two zero bytes
        // to avoid being escaped
        return append([]byte{0, 0}, bytes[2:]...)
    })
    bs = []byte(template.HTMLEscapeString(string(bs)))
    bs = re.ReplaceAllFunc(bs, func(match []byte) []byte {
        if string(match) == "\n" {
            return []byte("<br>")
        }

        id := string(match[2:])
        var buf bytes.Buffer
        link := urlfor.RouteWithPost("post-view", post, "pid", id)
        err := htmlTempl.ExecuteTemplate(&buf, "sub/postlink", Data{
            "Link" : link,
            "Text" : ID_PREFIX+id,
            "Id" : id,
        })
        if err != nil { panic(err) }
        return buf.Bytes()
    })
    return template.HTML(bs)
}

func removePrefix(name string) string {
    sep := roudetef.REROUTE_SEP
    i := strings.Index(name, sep)
    return string([]byte(name)[i+1:])
}

func getPrefix(r *ht.Request, name string) string {
    sep := roudetef.REROUTE_SEP
    if i := strings.Index(name, sep); i != -1 {
        return string([]byte(name)[0:i])
    }
    switch t := context.Get(r, key.RouteName).(type) {
        case string:
            name = t
    }
    if i:= strings.Index(name, sep); i != -1 {
        return string([]byte(name)[0:i])
    }
    return ""
}
