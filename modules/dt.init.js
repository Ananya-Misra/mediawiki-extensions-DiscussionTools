var controller = require( './controller.js' );

/**
 * @class mw.dt
 * @singleton
 */
mw.dt = {};

if ( new mw.Uri().query.dtdebug ) {
	mw.loader.load( 'ext.discussionTools.debug' );
} else if ( mw.config.get( 'wgIsProbablyEditable' ) ) {
	mw.hook( 'wikipage.content' ).add( function ( $container ) {
		$container.find( '.mw-parser-output' ).each( function () {
			var $node = $( this );
			// Don't re-run if we already handled this element
			// eslint-disable-next-line no-jquery/no-class-state
			if ( !$node.hasClass( 'dt-init-done' ) ) {
				controller.init( $node );
			}
		} );
	} );
}

module.exports = {
	controller: require( './controller.js' ),
	parser: require( './parser.js' ),
	modifier: require( './modifier.js' ),
	utils: require( './utils.js' ),
	logger: require( './logger.js' )
};
