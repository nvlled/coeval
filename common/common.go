
package common

import (
    "regexp"
)

/* Common code that can be shared
   between client and server */

func ParseIds(postBody string) []string {
    var rePid = regexp.MustCompile(`>>\d+`)
    var pids []string
    for _,id := range rePid.FindAllString(postBody, 0) {
        pids = append(pids, id)
    }
    return pids
}

func ToMap(params ...string) map[string]string {
    m := make(map[string]string)
    for i := 0; i < len(params) - 1; i += 2 {
        k, v := params[i], params[i+1]
        m[k] = v
    }
    return m
}
