
package fora

import (
    "github.com/nvlled/rule"
    "regexp"
)

const (
    MAX_BID_LEN = 5
    MAX_DESC_LEN = 30
    MAX_USERNAME_LEN = 10
    MIN_USERNAME_LEN = 4
    MAX_POST_TITLE_LEN = 50
    MAX_POST_BODY_LEN = 200
)

func cb(fn func(b Board) rule.Error) rule.T {
    return rule.T(func(t interface{}) rule.Error {
        switch t := t.(type) {
            case Board: return fn(t)
        }
        return rule.AnError("invalid type, expected Board")
    })
}

func cu(fn func(User) rule.Error) rule.T {
    return rule.T(func(t interface{}) rule.Error {
        switch t := t.(type) {
            case User: return fn(t)
        }
        return rule.AnError("invalid type, expected User")
    })
}

func cp(fn func(Post) rule.Error) rule.T {
    return rule.T(func(t interface{}) rule.Error {
        switch t := t.(type) {
            case Post: return fn(t)
        }
        return rule.AnError("invalid type, expected Post")
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
        return rule.AnError("desc", "too long")
    }
    if len(b.Id()) == 0 {
        return rule.AnError("desc", "required")
    }
    return nil
}

func usernameIsValid(user User) rule.Error {
    err := rule.Error{}
    if len(user.Name()) > MAX_USERNAME_LEN {
        err.Insert("username", "too long")
    } else if len(user.Name()) < MIN_USERNAME_LEN {
        err.Insert("username", "too short")
    }
    return err
}

func usernameHasValidChars(user User) rule.Error {
    re := regexp.MustCompile(`^[a-z][_a-zA-Z0-9]+$`)
    if !re.Match([]byte(user.Name())) {
        return rule.AnError("username", "invalid characters")
    }
    return nil
}

func usernameIsAvailable(user User) rule.Error {
    u := user.CurrentUser()
    if userStore(u).GetUser(user.Name()) != nil {
        return rule.AnError("username", "not available")
    }
    return nil
}

func postTitleValidLen(post Post) rule.Error {
    if len(post.Title()) > MAX_POST_TITLE_LEN {
        return rule.AnError("title", "too long")
    }
    return nil
}

func postBodyValidLen(post Post) rule.Error {
    if len(post.Body()) > MAX_POST_BODY_LEN {
        return rule.AnError("body", "too long")
    }
    return nil
}

func postHasBody(post Post) rule.Error {
    if len(post.Body()) == 0 {
        return rule.AnError("body", "need body")
    }
    return nil
}

var verifyBoardCreate = rule.All(
    cb(bidAvailable),
    cb(bidLenValid),
    cb(descLenValid),
)

var verifyUserDetails = rule.One(
    cu(usernameIsValid),
    cu(usernameHasValidChars),
    cu(usernameIsAvailable),
)

var verifyPostDetails = rule.One(
    cp(postTitleValidLen),
    cp(postBodyValidLen),
    cp(postHasBody),
)





