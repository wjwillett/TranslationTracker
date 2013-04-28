/* This file contains generic utility functions that could be called by any
 * function within the project
 */


/* 
 * trim function: remove whitespace from ends of input string.
 */
 function trim (str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
}