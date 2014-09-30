
package control

import (
	"io"
	"os"
	"fmt"
	"log"
	"errors"
	"net/http"
	"github.com/gorilla/mux"
)

const (
	threadURL = "http://a.4cdn.org/%s/thread/%s.json"
	testFile  = "static/public/testdata.json"
)

func ChanThread(w http.ResponseWriter, r *http.Request) {
	bid := mux.Vars(r)["bid"]
	tid := mux.Vars(r)["tid"]
	test := mux.Vars(r)["test"]

	var reader io.Reader
	if test != "" || tid == "" {
		f, err := os.Open(testFile)
		if err != nil {
			log.Println("failed to read test file", err)
			flunk(errors.New("Evil has vanquished your mum"))
		}
		reader = f
	} else {
		url := fmt.Sprintf(threadURL, bid, tid)
		resp, err := http.Get(url)
		if err != nil {
			w.WriteHeader(401);
		}
		reader = resp.Body
		flunk(err)
	}

	_, err := io.Copy(w, reader)
	flunk(err)
}






