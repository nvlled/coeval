
package fora

import (
	"nvlled/rule"
	"fmt"
)

//type Error string
//
//func (err Error) Error() string {
//	return string(err)
//}

var AdminError = rule.AnError("__msg", "User must be admin to create a board")

func BoardNotFound(bid Bid) error {
	msg := fmt.Sprintf("board %v is not found", bid)
	return rule.AnError("__msg", msg)
}





