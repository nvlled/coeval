
package rend

import (
	"html/template"
	ht "net/http"
	"log"
	"path/filepath"
	"io/ioutil"
	"strings"
)

var htmlTempl *template.Template

var RenderHtml = func(name string, w ht.ResponseWriter, r *ht.Request, data Data) {
	err := htmlTempl.ExecuteTemplate(w, name, data)
	if err != nil {
		// show a page containing the error
		log.Println("failed to execute template", err.Error())
	}
}

func loadTemplates(env map[string]interface{}) {
	funcs := template.FuncMap(env)
	templ, err := template.New("coeval").Funcs(funcs).ParseGlob("static/template/includes/*.html")
	if err != nil {
		panic(err)
	}
	htmlTempl = templ
	files,err := filepath.Glob("static/template/pages/*.html")
	if err != nil {
		panic(err)
	}

	for _,filename := range files {
		ext := filepath.Ext(filename)
		templName := strings.TrimSuffix(filepath.Base(filename), ext)
		//println(">>", templName)
		_, err = parseFiles(htmlTempl, templName, filename)
		if err != nil {
			panic(err)
		}
	}
}

func parseFiles(t *template.Template, name string, filename string) (*template.Template, error) {
	b, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	s := string(b)

	_, err = t.New(name).Parse(s)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func init() {
	htmlTempl = template.New("default")
}




