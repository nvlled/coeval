
package urlfor

import (
    "nvlled/coeval/fora"
    "path"
)

type UrlMaker func(name string, params ...string)string

var createUrl UrlMaker

func init() {
    SetUrlMaker(createDefaultUrl)
}

func Board(board fora.Board) string {
    return RouteWithBoard("board-view", board)
}

func Thread(thread fora.Thread) string {
    return RouteWithThread("thread-view", thread)
}

func Post(post fora.Post) string {
    return RouteWithPost("post-view", post)
}

func RouteWithBoard(name string, board fora.Board, params ...string) string {
    bid := string(board.Id())
    params = append([]string{"bid", bid}, params...)
    return Route(name, params...)
}

func RouteWithThread(name string, thread fora.Thread, params ...string) string {
    tid := string(thread.Id())
    bid := string(thread.Board().Id())

    init := []string{"bid", bid, "tid", tid}
    params = append(init, params...)
    return Route(name, params...)
}

func RouteWithPost(name string, post fora.Post, params ...string) string {
    thread := post.Thread()
    pid := string(post.Id())
    tid := string(thread.Id())
    bid := string(thread.Board().Id())

    init := []string{"bid", bid, "tid", tid, "pid", pid}
    params = append(init, params...)
    return Route(name, params...)
}

func Route(name string, params ...string) string {
    return createUrl(name, params...)
}

func SetUrlMaker(maker UrlMaker) { createUrl = maker }

func createDefaultUrl(name string, params ...string) string {
    url := path.Join(params...)
    url = path.Join(name, url)
    return url
}
