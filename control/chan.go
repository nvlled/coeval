
package control

import (
	"io"
	"fmt"
	"net/http"
	"github.com/gorilla/mux"
)

const (
	threadURL = "http://a.4cdn.org/%s/thread/%s.json"
)

func ChanThread(w http.ResponseWriter, r *http.Request) {
	bid := mux.Vars(r)["bid"]
	tid := mux.Vars(r)["tid"]
	url := fmt.Sprintf(threadURL, bid, tid)
	resp, err := http.Get(url)
	flunk(err)
	n, err := io.Copy(w, resp.Body)
	flunk(err)
}

