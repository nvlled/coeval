
package rend

import (
    ht "net/http"
    "encoding/json"
    "strings"
)

var renderers map[string]T

// Keys starting with __ in `data` will not be
// included in the serialization.
func RenderJson(name string, w ht.ResponseWriter, r *ht.Request, data Data) {
    if render, ok := renderers[name]; ok {
        render(name, w, r, data)
    } else {
        data_ := filterPrivate(data)
        bytes, err := json.MarshalIndent(data_, "", "    ")
        if err != nil { panic(bytes) }
        w.Write(bytes)
    }
}

func filterPrivate(data Data) Data {
    data_ := make(Data)
    for k, v := range data {
        if strings.HasPrefix(k, "__") {
            continue
        }
        data_[k] = v
    }
    return data_
}

func initRenderers() {
    renderers = make(map[string]T)
    renderers["thread-view"] = ThreadView
    renderers["board-page"] = BoardPage
}

func init() {
    initRenderers()
}
