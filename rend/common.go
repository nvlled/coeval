
package rend

import (
    "regexp"
    "bytes"
    "html/template"
)

func RenderPostlinks(text string) template.HTML {
    re := regexp.MustCompile(`>>\d+`)
    bs := re.ReplaceAllFunc([]byte(text), func(idBytes []byte) []byte {
        id := string(idBytes)
        var buf bytes.Buffer
        err := htmlTempl.ExecuteTemplate(&buf, "sub/postlink", Data{
            "Text" : id,
            "Id" : string(idBytes[2:]),
        })
        if err != nil { panic(err) }
        return buf.Bytes()
    })
    return template.HTML(bs)
}
