jQuery(document).ready(function ($) {

    'use strict';

    // Starting variables and cached selectors
    var searchClass = 'js-search-results';
    var showClass = 'js-show';
    var disabledClass = 'js-disabled';

    var definitionsContainer = $('.definitions');
    var searchElements = definitionsContainer.find('dt, dd');
    var sectionTitles = definitionsContainer.find('h2');
    var sidebarNav = $('.sidebar-alphabet').find('a');



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

        // Show everything - an empty search implies that we reset everything
        if (searchTerm === '') {
            definitionsContainer.removeClass(searchClass);
            definitionsContainer.find('.' + showClass).removeClass(showClass);
            resetNav();
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

        // Hide everything to start with with css, then override on the matches
        definitionsContainer.addClass(searchClass);

        $.each(slugs, function(index, slug) {
            var matches = searchElements.filter("[data-slug=" + slug + "]");
            matches.addClass(showClass);
            // Remove hide class from section title
            matches.parent().prev().addClass(showClass);
        });

        // Update the nav
        updateNav();

    };



    var resetNav = function () {
        sidebarNav.removeClass(disabledClass);
        sidebarNav.off('click').on('click', function (e) {
            return true;
        });
    };



    var updateNav = function () {

        resetNav();

        // Add disabled class to those sections without a match
        var disabledSections = sectionTitles.not('.' + showClass).map(function () {
            return '[href="#' + $(this).children('a').attr('name') + '"]';
        }).get();
        sidebarNav.filter(disabledSections.join()).addClass(disabledClass);

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
