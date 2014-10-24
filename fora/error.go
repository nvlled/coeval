
package fora

import (
    "github.com/nvlled/rule"
    "fmt"
)

var AdminError = rule.AnError("__msg", "User must be admin to create a board")

func BoardNotFound(bid Bid) error {
    msg := fmt.Sprintf("board %v is not found", bid)
    return rule.AnError("__msg", msg)
}

func ThreadNotFound(tid Tid) error {
    msg := fmt.Sprintf("thread %v is not found", tid)
    return rule.AnError("__msg", msg)
}

