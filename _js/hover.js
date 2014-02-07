jQuery(document).ready(function ($) {

    // Apply a hover class to dl items with a matching data-slug attribute
    $('dt, dd').hover(function() {
        var slug = $(this).data('slug');
        $(this).parent().children('[data-slug="' + slug + '"]').toggleClass('hover');
    });

});

