
package main

import (
	"testing"
	"io/ioutil"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
)

func TestServer(t *testing.T) {
	h := createHandler()
	server := httptest.NewServer(h)
	u := server.URL
	client := createClient()
	println(get(client, u+"/"))
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
	return resp, body(resp)
}

func get(c *http.Client, path string) string {
	resp, _ := c.Get(path)
	return body(resp)
}

func post(c *http.Client, path string) string {
	resp, _ := c.Post(path, "", nil)
	return body(resp)
}

func body(resp *http.Response) string {
	s,_ := ioutil.ReadAll(resp.Body)
	return string(s)
}

func createClient() *http.Client {
	c := new(http.Client)
	c.Jar,_ = cookiejar.New(nil)
	return c
}



