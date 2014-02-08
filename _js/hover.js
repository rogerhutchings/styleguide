jQuery(document).ready(function ($) {

    // Apply a hover class to dl items with a matching data-slug attribute
    $('dt, dd').hover(function() {
        $(this).parent().children('[data-slug="' + $(this).data('slug') + '"]').toggleClass('hover');
    });

});
