jQuery(document).ready(function ($) {

    'use strict';

    // Adds a hover class to all elements sharing the same data slug, so the
    // permalink icon appears no matter which bit of a definition is being
    // hovered over.

    // Starting variables and cached selectors
    var hoverClass = 'js-hover';

    var definitions = $('.definitions').find('dt, dd');



    definitions.mouseenter(function () {
        $(this).parent().children('[data-slug="' + $(this).data('slug') + '"]').addClass(hoverClass);
    })
    .mouseleave(function () {
        // Remove from all to prevent any weird edge cases
        definitions.removeClass(hoverClass);
    });

});
