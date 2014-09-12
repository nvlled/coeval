
package fora

type PermissionError string

func (err PermissionError) Error() string { return string(err) }

var AdminError PermissionError = PermissionError("User must be admin to create a board")
