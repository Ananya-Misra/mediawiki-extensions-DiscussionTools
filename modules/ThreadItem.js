/**
 * @external CommentItem
 */

var utils = require( './utils.js' );

/**
 * A thread item, either a heading or a comment
 *
 * @class ThreadItem
 * @constructor
 * @param {string} type `heading` or `comment`
 * @param {number} level Item level in the thread tree
 * @param {Object} range Object describing the extent of the comment, including the
 *  signature and timestamp. It has the same properties as a Range object: `startContainer`,
 *  `startOffset`, `endContainer`, `endOffset` (we don't use a real Range because they change
 *  magically when the DOM structure changes).
 */
function ThreadItem( type, level, range ) {
	this.type = type;
	this.level = level;
	this.range = range;

	/**
	 * @member {string} Unique ID (within the page) for this comment, intended to be used to
	 *  find this comment in other revisions of the same page
	 */
	this.id = null;
	/**
	 * @member {CommentItem[]} Replies to this thread item
	 */
	this.replies = [];

	this.rootNode = null;
}

OO.initClass( ThreadItem );

/**
 * Get the list of authors in the comment tree below this thread item.
 *
 * Usually called on a HeadingItem to find all authors in a thread.
 *
 * @return {string[]} Author usernames
 */
ThreadItem.prototype.getAuthorsBelow = function () {
	var authors = {};
	function getAuthorSet( comment ) {
		authors[ comment.author ] = true;
		// Get the set of authors in the same format from each reply
		comment.replies.map( getAuthorSet );
	}

	this.replies.map( getAuthorSet );

	return Object.keys( authors ).sort();
};

/**
 * Get the name of the page from which this thread item is transcluded (if any).
 *
 * @return {string|boolean} `false` if this item is not transcluded. A string if it's transcluded
 *   from a single page (the page title, in text form with spaces). `true` if it's transcluded, but
 *   we can't determine the source.
 */
ThreadItem.prototype.getTranscludedFrom = function () {
	var coveredNodes, i, node, dataMw;

	// If some template is used within the comment (e.g. {{ping|…}} or {{tl|…}}, or a
	// non-substituted signature template), that *does not* mean the comment is transcluded.
	// We only want to consider comments to be transcluded if all wrapper elements (usually
	// <li> or <p>) are marked as part of a single transclusion.

	// If we can't find "exact" wrappers, using only the end container works out well
	// (because the main purpose of this method is to decide on which page we should post
	// replies to the given comment, and they'll go after the comment).

	coveredNodes = utils.getFullyCoveredSiblings( this ) ||
		[ this.range.endContainer ];

	node = utils.getTranscludedFromElement( coveredNodes[ 0 ] );
	for ( i = 1; i < coveredNodes.length; i++ ) {
		if ( node !== utils.getTranscludedFromElement( coveredNodes[ i ] ) ) {
			// Comment is only partially transcluded, that should be fine
			return false;
		}
	}

	if ( !node ) {
		// No mw:Transclusion node found, this item is not transcluded
		return false;
	}

	dataMw = JSON.parse( node.getAttribute( 'data-mw' ) );

	// Only return a page name if this is a simple single-template transclusion.
	if (
		dataMw &&
		dataMw.parts &&
		dataMw.parts.length === 1 &&
		dataMw.parts[ 0 ].template &&
		dataMw.parts[ 0 ].template.target.href
	) {
		// Slice off the './' prefix and convert to text form (underscores to spaces, URL-decoded)
		return mw.libs.ve.normalizeParsoidResourceName( dataMw.parts[ 0 ].template.target.href );
	}

	// Multi-template transclusion, or a parser function call, or template-affected wikitext outside
	// of a template call, or a mix of the above
	return true;
};

/**
 * Return a native Range object corresponding to the item's range.
 *
 * @return {Range}
 */
ThreadItem.prototype.getNativeRange = function () {
	var
		doc = this.range.startContainer.ownerDocument,
		nativeRange = doc.createRange();
	nativeRange.setStart( this.range.startContainer, this.range.startOffset );
	nativeRange.setEnd( this.range.endContainer, this.range.endOffset );
	return nativeRange;
};

// TODO: Implement getHTML/getText if required

module.exports = ThreadItem;
