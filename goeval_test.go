
package main

import (
    "testing"
    "io/ioutil"
    "net/http"
    "net/http/cookiejar"
    "net/http/httptest"
    "strings"
    "io"
    //"net/url"
    //"fmt"
)

func TestServer(t *testing.T) {
    initMessageBoard()
    h := createHandler()
    server := httptest.NewServer(h)
    u := server.URL
    client := createClient()

    println(get(client, u+"/login"))
    println(get(client, u+"/board/g/thread/0"))

    //_,body := post(client, "bid=g&desc=someshit", u+"/admin/board/create/?bid=h&desc=someshit")
    //println(body)
}

func request(c *http.Client, method, path string, headers ...string) (*http.Response, string) {
    request,_ := http.NewRequest(method, path, nil)
    i := 0
    for i < len(headers) - 1 {
        key := headers[i]
        val := headers[i+1]
        request.Header[key] = []string{val}
        i += 2
    }
    resp,_ := c.Do(request)
    return resp, getBody(resp)
}

func post(c *http.Client, body , path string, headers ...string) (*http.Response, string) {
    request,_ := http.NewRequest("POST", path, stringReadCloser(body))
    i := 0
    for i < len(headers) - 1 {
        key := headers[i]
        val := headers[i+1]
        request.Header[key] = []string{val}
        i += 2
    }
    resp,err := c.Do(request)
    if err != nil {
        println("error: ", err.Error())
        return nil, ""
    }
    return resp, getBody(resp)
}

type StringRC struct {
    body io.Reader
}

func (s StringRC) Read(p []byte) (int, error) {
    return s.body.Read(p)
}
func (s StringRC) Close() error {
    return nil
}

func stringReadCloser(s string) io.ReadCloser {
    return StringRC{strings.NewReader(s)}
}

func get(c *http.Client, path string) string {
    resp, _ := c.Get(path)
    return getBody(resp)
}

func getBody(resp *http.Response) string {
    s,_ := ioutil.ReadAll(resp.Body)
    return string(s)
}

func createClient() *http.Client {
    c := new(http.Client)
    c.Jar,_ = cookiejar.New(nil)
    return c
}

