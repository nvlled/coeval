

package rend

import (
//    "html/template"
    ht "net/http"
)

var renderers map[string]T

// Keys starting with __ in `data` will not be
// included in the serialization.
func RenderJson(name string, w ht.ResponseWriter, r *ht.Request, data Data) {
    if render, ok := renderers[name]; ok {
        render(name, w, r, data)
    } else {
        // serialize data
    }
}

func ThreadView(_ string, w ht.ResponseWriter, r *ht.Request, data Data) {
    // do something else
    // then serialize data
}

func initRenderers() {
    renderers = make(map[string]T)
    renderers["thread-view"] = ThreadView
}

func init() {
    initRenderers()
}




