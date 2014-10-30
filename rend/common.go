
package rend

import (
    "regexp"
    "bytes"
    "html/template"
    "nvlled/coeval/fora"
    "nvlled/coeval/urlfor"
)

func RenderPostlinks(post fora.Post) template.HTML {
    idRe := regexp.MustCompile(`>>\d+`)
    brRe:= regexp.MustCompile(`\n`)

    bs := idRe.ReplaceAllFunc([]byte(post.Body()), func(idBytes []byte) []byte {
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
    bs = brRe.ReplaceAllFunc(bs, func(_ []byte) []byte {
        return []byte("<br>")
    })
    return template.HTML(bs)
}
