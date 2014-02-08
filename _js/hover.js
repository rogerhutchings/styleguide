jQuery(document).ready(function ($) {

    'use strict';

    var hoverClass = 'js-hover';

    // Apply a hover class to dl items with a matching data-slug attribute
    var definitions = $('dt, dd');

        definitions.mouseenter(function () {
            $(this).parent().children('[data-slug="' + $(this).data('slug') + '"]').addClass(hoverClass);
        })
        .mouseleave(function () {
            // Remove from all to prevent any weird edge cases
            definitions.removeClass(hoverClass);
        });


});
