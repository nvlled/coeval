
package rend

import (
    "regexp"
    "bytes"
    "html/template"
    "nvlled/coeval/fora"
    "nvlled/coeval/urlfor"
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
