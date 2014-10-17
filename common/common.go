
package common

import (
    "regexp"
    "nvlled/coeval/fora"
)

/* Common code that can be shared
   between client and server */

func ParseIds(postBody string) []fora.Pid {
    var rePid = regexp.MustCompile(`>>\d+`)
    var pids []fora.Pid
    for id := range rePid.FindAllString(postBody, 0) {
        pids = append(pids, fora.Pid(id))
    }
    return pids
}

