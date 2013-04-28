/**
* jQuery plugin to replace text strings
* Taken from @link http://net.tutsplus.com/tutorials/javascript-ajax/spotlight-jquery-replacetext/
*/

$.fn.replaceText = function( search, replace, text_only ) {
return this.each(function(){
        var node = this.firstChild,
        val, new_val, remove = [];
        if ( node ) {
            do {
              if ( node.nodeType === 3 ) {
                val = node.nodeValue;
                new_val = val.replace( search, replace );
                if ( new_val !== val ) {
                  if ( !text_only && /</.test( new_val ) ) {
                    $(node).before( new_val );
                    remove.push( node );
                  } else {
                    node.nodeValue = new_val;
                  }
                }
              }
            } while ( node = node.nextSibling );
        }
        remove.length && $(remove).remove();
    });
};

/**
* jQuery wrapper to process standard tags in the target document and assign span styles.
* Expects JSON properly formatted
*/

processHighlights = function(Input) {
	for(i = 0; i < Input.length; i++){ 
		$('body').replaceText(Input[i].Word, '<span class="highlight'+Input[i].Color+'">$1</span>');
		$('div').replaceText(Input[i].Word, '<span class="highlight'+Input[i].Color+'">$1</span>');
		$('p').replaceText(Input[i].Word, '<span class="highlight'+Input[i].Color+'">$1</span>');
		$('h2').replaceText(Input[i].Word, '<span class="highlight'+Input[i].Color+'">$1</span>');
	}
}

/* //Example Constructor: 
 * 
 * NOTE: Dynamic appending of REQUIRED style sheet and JSON format of Words variable.
 *
 * var Words = 
 * [
 *	{ "Word": /(sample)/gi , "Color": 1},
 *	{ "Word": /(text)/gi   , "Color": 2},
 *	{ "Word": /(lorem)/gi  , "Color": 3}
 * ]
 *
 * //Call function on document ready
 * $(document).ready(function() {
 *  $('head').append('<link rel="stylesheet" type="text/css" href="color_level_styles.css">');
 *  $('head').append('<script src="genericUtilities.js"></script>'); 
 * 	processHighlights(Words);
 * });
 */