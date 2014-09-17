
package rend

import (
	"html/template"
	ht "net/http"
)

// moved to env
//var funcMap = template.FuncMap{
//	url: func(name string) string{
//		return routes.URL(name)
//	},
//}

var htmlTempl *template.Template

func RenderHtml(name string, data interface{}, w ht.ResponseWriter, r *ht.Request) {
	// htmlTempl.ExecuteTemplate(w, name, data)
}

func init() {
	htmlTempl = template.New("test")
}

