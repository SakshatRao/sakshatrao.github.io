// Animate Smooth Scroll to top of page
$('.scroll_button').on('click', function() {
    $('html, body').animate(
        {
        scrollTop: $($(this).attr('href')).offset().top
        },
        1200
    );
});

// Animate Smooth Scroll to top of content
$('.scroll_button_2').on('click', function() {
    $('html, body').animate(
        {
        scrollTop: $($(this).attr('href')).offset().top
        },
        1200
    );
});