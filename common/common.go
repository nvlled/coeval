
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
