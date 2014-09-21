
package fora

import (
	"nvlled/rule"
)

const (
	MAX_BID_LEN = 5
	MAX_DESC_LEN = 30
)

func cast(fn func(b Board) rule.Error) rule.T {
	return rule.T(func(t interface{}) rule.Error {
		switch t := t.(type) {
			case Board: return fn(t)
		}
		return rule.AnError("invalid type, expected Board")
	})
}

func bidAvailable(b Board) rule.Error {
	if BoardExists(b.Id()) {
		return rule.AnError("bid", "not available")
	}
	return nil
}

func bidLenValid(b Board) rule.Error {
	if len(b.Id()) > MAX_BID_LEN {
		return rule.AnError("bid", "too long")
	} else if len(b.Id()) == 0 {
		return rule.AnError("bid", "required")
	}
	return nil
}

func descLenValid(b Board) rule.Error {
	if len(b.Id()) > MAX_BID_LEN {
		// too redundant, maybe something like
		// too long
		// not available
		// ... instead
		return rule.AnError("desc", "too long")
	}
	if len(b.Id()) == 0 {
		return rule.AnError("desc", "required")
	}
	return nil
}

var verifyBoardCreate = rule.All(
	cast(bidAvailable),
	cast(bidLenValid),
	cast(descLenValid),
)




