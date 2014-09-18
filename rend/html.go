
package rend

import (
	"html/template"
	ht "net/http"
	"log"
)

// moved to env
//var funcMap = template.FuncMap{
//	url: func(name string) string{
//		return routes.URL(name)
//	},
//}

var htmlTempl *template.Template

var RenderHtml = func(name string, w ht.ResponseWriter, r *ht.Request, data Data) {
	err := htmlTempl.ExecuteTemplate(w, "home", data)
	if err != nil {
		log.Println("failed to execute template", err.Error())
	}
}

func loadTemplates(env map[string]interface{}) {
	funcs := template.FuncMap(env)
	templ, err := template.New("goeval").Funcs(funcs).ParseGlob("static/template/*.html")
	if err != nil {
		panic(err)
	}
	htmlTempl = templ
}

func init() {
	htmlTempl = template.New("default")
}






