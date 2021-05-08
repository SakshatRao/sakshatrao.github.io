// Animate Smooth Scroll
$('.scroll_button').on('click', function() {
    $('html, body').animate(
        {
        scrollTop: $($(this).attr('href')).offset().top
        },
        1500
    );
});

$('.scroll_button_2').on('click', function() {
    $('html, body').animate(
        {
        scrollTop: $($(this).attr('href')).offset().top
        },
        1500
    );
});