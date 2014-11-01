
package rule

import (
	"encoding/gob"
	"fmt"
	"strings"
)

type Error map[string]Msgs
type T func(obj interface{}) Error
type Msgs []string

func Passed(err Error) bool {
	return err == nil || len(err) == 0
}

func Failed(err Error) bool {
	return !Passed(err)
}

func (ms Msgs) String() string {
	return strings.Join(ms, ", ")
}

func (err Error) Insert(name string, msg string) {
    err[name] = append(err[name], msg)
}

func (err Error) Error() string {
	var s string
	for k, v := range err {
		s += fmt.Sprintf("%v: %v\n", k, v)
	}
	return s
}

func One(rules ...T) T {
	return T(func(obj interface{}) Error {
		for _,rule := range rules {
			err := rule(obj)
			if Failed(err) {
				return err
			}
		}
		return nil
	})
}

func All(rules ...T) T {
	return T(func(obj interface{}) Error {
		var allErrors Error
		for _,rule := range rules {
			err := rule(obj)
			allErrors = Merge(allErrors, err)
		}
		if len(allErrors) == 0 {
			return nil
		}
		return allErrors
	})
}

func Merge(dest Error, src Error) Error {
	if dest == nil {
		return src
	}
	for k,v := range src {
		dest[k] = append(dest[k], v...)
	}
	return dest
}

func AnError(name string, messages ...string) Error {
	return Error{name : Msgs(messages)}
}

func init() {
	gob.Register(&Msgs{})
	gob.Register(&Error{})
}

func main() {
}
