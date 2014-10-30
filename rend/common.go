
package rend

import (
    "regexp"
    "bytes"
    "html/template"
    "nvlled/coeval/fora"
    "nvlled/coeval/urlfor"
)

func RenderPostlinks(post fora.Post) template.HTML {
    re := regexp.MustCompile(`>>\d+`)
    bs := re.ReplaceAllFunc([]byte(post.Body()), func(idBytes []byte) []byte {
        id := string(idBytes[2:])
        text := string(idBytes)
        var buf bytes.Buffer

        link := urlfor.RouteWithPost("post-view", post, "pid", id)
        err := htmlTempl.ExecuteTemplate(&buf, "sub/postlink", Data{
            "Link" : link,
            "Text" : text,
            "Id" : id,
        })
        if err != nil { panic(err) }
        return buf.Bytes()
    })
    return template.HTML(bs)
}
