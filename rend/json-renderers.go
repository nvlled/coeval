package rend

import (
    ht "net/http"
    "encoding/json"
    "nvlled/coeval/fora"
)

func ThreadView(_ string, w ht.ResponseWriter, r *ht.Request, data Data) {
    var thread fora.Thread
    switch t := data["thread"].(type) {
        case fora.Thread:
            thread = t
        default:
            w.Write([]byte("{}"))
            return
    }
    bytes, _ := json.MarshalIndent(Data{
        "id" : thread.Id(),
        "title" : thread.Title(),
        "body" : thread.Body(),
        "creator" : thread.Creator().Name(),
        "posts" : thread.GetPosts(),
    }, "", "    ")
    w.Write(bytes)
}

func BoardPage(_ string, w ht.ResponseWriter, r *ht.Request, data Data) {
    var threads []fora.Thread
    switch t := data["threads"].(type) {
        case []fora.Thread:
            threads = t
        default:
            w.Write([]byte("{}"))
            return
    }
    var output []Data
    for _,thread := range threads {
        m := Data{
            "id" : thread.Id(),
            "title" : thread.Title(),
            "body" : thread.Body(),
            "creator" : thread.Creator().Name(),
            "recent-posts" : thread.RecentPosts(),
        }
        output = append(output, m)
    }
    bytes, _ := json.MarshalIndent(output, "", "   ")
    w.Write(bytes)
}
