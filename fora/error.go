
package fora

import (
	"nvlled/rule"
)

type PermissionError string

func (err PermissionError) Error() string { return string(err) }

//var AdminError PermissionError = PermissionError("User must be admin to create a board")

type Error map[string]string

var AdminError = rule.AnError("__msg", "User must be admin to create a board")
