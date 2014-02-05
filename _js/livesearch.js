jQuery(document).ready(function ($) {

    // Save selectors
    var searchElements = $('.definitions').find('dt, dd');
    var sectionTitles = $('h2');

    // Add in a delay so it doesn't go mental on every keystroke
    // http://stackoverflow.com/questions/1909441/jquery-keyup-delay
    var delay = (function () {
        var timer = 0;
        return function(callback, ms) {
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
        };
    })();

    // Search function
    var search = function (searchTerm) {

        // If there's nothing, show everything!
        if (searchTerm === '') {
            searchElements.removeClass('hide');
            sectionTitles.removeClass('hide');
            return;
        }

        // Otherwise, build an array of slugs that match elements containing our
        // search key
        var slugs = [];
        searchElements.filter(function () {
            return $(this).text().toLowerCase().indexOf(searchTerm) >= 0;
        }).each(function () {
            slugs.push($(this).data('slug'));
        });
        slugs = jQuery.unique(slugs);

        // Hide everything to start with, then show the matches
        searchElements.addClass('hide');
        sectionTitles.addClass('hide');
        $.each(slugs, function(index, slug) {
            var matches = searchElements.filter("[data-slug=" + slug + "]");
            matches.removeClass('hide');
            matches.parent().prev().removeClass('hide');
        });

    };

    // Using proxy to define context
    $("#search").keyup(function () {
        delay($.proxy(function () {
            search($(this).val());
        }, this), 400);
    });

});
