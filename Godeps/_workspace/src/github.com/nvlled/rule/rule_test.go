
package rule

import (
	"testing"
	"fmt"
)

type account struct  {
	username string
	password string
}

type Fn func(x int) int

func cast(fn func(acc account) Error) T {
	return T(func(t interface{}) Error {
		switch t := t.(type) {
		case account: return fn(t)
		}
		return AnError("invalid type")
	})
}

func usernameIsDumb(acc account) Error {
	if acc.username == "dumb" {
		return AnError("username", "username is dumb")
	}
	return nil
}

func passwordIsDumb(acc account) Error {
	if acc.password == "dumb" {
		return AnError("password", "password is dumb")
	}
	return nil
}

func passwordIsShort(acc account) Error {
	if len(acc.password) < 5 {
		return AnError("password", "password is too short")
	}
	return nil
}

func TestAll(t *testing.T) {
	acc1 := account{"dumb", "dumb"}
	acc2 := account{"nope", "dumb"}
	acc3 := account{"nope", "password"}

	rule := All(cast(usernameIsDumb), cast(passwordIsDumb), cast(passwordIsShort))

	err := rule(acc1)
	//fmt.Printf(">>\n", err)
	if err["username"] == nil {
		t.Error("username should fail")
	}
	if err["password"] == nil {
		t.Error("password should fail")
	}
	if !contains(err["password"], "password is dumb") ||
	!contains(err["password"], "password is too short"){
		t.Error("password is short and dumb")
	}

	err = rule(acc2)
	if err["username"] != nil {
		t.Error("username should pass")
	}
	if err["password"] == nil {
		t.Error("password should fail")
	}

	err = rule(acc3)
	if Failed(err) {
		t.Error("account should pass")
	}
}

func TestOne(t *testing.T) {
	acc1 := account{"dumb", "dumb"}
	acc2 := account{"nope", "dumb"}
	acc3 := account{"nope", "password"}

	rule := One(cast(usernameIsDumb), cast(passwordIsDumb))

	err := rule(acc1)
	if !contains(err["username"], "username is dumb") {
		t.Error("username should be dumb")
	}
	if err["password"] != nil {
		t.Error("One rule should only be tested")
	}

	err = rule(acc2)
	if err["username"] != nil {
		t.Error("One rule should only be tested")
	}
	if !contains(err["password"], "password is dumb") {
		t.Error("password should be dumb")
	}

	err = rule(acc3)
	if Failed(err) {
		t.Error("Rule should pass")
	}

	fmt.Printf("%v %v %v\n", acc1, acc2, rule)
}

func contains(msgs Msgs, s string) bool {
	for _,m := range msgs {
		if m == s { return true }
	}
	return false
}
