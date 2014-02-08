jQuery(document).ready(function ($) {

    'use strict';

    var hideClass = 'js-hide';
    var disabledClass = 'js-disabled';

    // Save selectors
    var searchElements = $('.definitions').find('dt, dd');
    var sectionTitles = $('h2');
    var sidebarNav = $('.sidebar-alphabet').find('a');

    var sections = [];
    for (var i = 97; i <= 122; i++) {
        sections[sections.length] = 'section-' + String.fromCharCode(i);
    }

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
            searchElements.removeClass(hideClass);
            sectionTitles.removeClass(hideClass);
            updateNav();
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
        searchElements.addClass(hideClass);
        sectionTitles.addClass(hideClass);
        $.each(slugs, function(index, slug) {
            var matches = searchElements.filter("[data-slug=" + slug + "]");
            matches.removeClass(hideClass);
            // Remove hide class from section title
            matches.parent().prev().removeClass(hideClass);
        });

        // Update the nav
        updateNav();

    };

    var updateNav = function() {

        // Reset behaviour
        sidebarNav.removeClass(disabledClass);
        sidebarNav.off('click').on('click', function (e) {
            return true;
        });

        // Add disabled class
        var disabledSections = sectionTitles.filter('.' + hideClass).map(function () {
            return '[href="#' + $(this).children('a').attr('name') + '"]';
        }).get().join();
        sidebarNav.filter(disabledSections).addClass(disabledClass);

        // Disable links
        sidebarNav.filter('.' + disabledClass).off('click').on('click', function (e) {
            e.preventDefault();
            return false;
        });
    };

    // Using proxy to define context
    $("#search").keyup(function () {
        delay($.proxy(function () {
            search($(this).val());
        }, this), 400);
    });

});
