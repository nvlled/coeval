package rend

import (
    ht "net/http"
    "encoding/json"
    "nvlled/coeval/fora"
)

func ThreadReply(_ string, w ht.ResponseWriter, r *ht.Request, data Data) {
    var post fora.Post
    switch t := data["post"].(type) {
        case fora.Post:
            post = t
        default:
            bytes,_ := json.Marshal(filterPrivate(data))
            w.Write(bytes)
            return
    }
    bytes, _ := json.MarshalIndent(Data{
        "id" : post.Id(),
        "title" : post.Title(),
        "body" : RenderPostlinks(post),
        "creator" : post.Creator().Name(),
    }, "", "    ")
    w.Write(bytes)
}

func ThreadCreate(_ string, w ht.ResponseWriter, r *ht.Request, data Data) {
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
        "url" : data["url"],
    }, "", "    ")
    w.Write(bytes)
}

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
