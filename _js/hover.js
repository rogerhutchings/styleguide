jQuery(document).ready(function ($) {

    // // Apply a hover class to dl items with a matching data-slug attribute
    var definitions = $('dt, dd');

        definitions.mouseenter(function () {
            $(this).parent().children('[data-slug="' + $(this).data('slug') + '"]').addClass('hover');
        })
        .mouseleave(function () {
            // Remove from all to prevent any weird edge cases
            definitions.removeClass('hover');
        });


});
