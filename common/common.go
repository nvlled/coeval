
package common

import (
    "regexp"
    "nvlled/coeval/fora"
)

/* Common code that can be shared
   between client and server */

var rePid = regexp.MustCompile(`>>\d+`)

func ParseIds(postBody string) []fora.Pid {
    var pids []fora.Pid
    for id := range rePid.FindAllString(postBody, 0) {
        pids = append(pids, id)
    }
    return pids
}





