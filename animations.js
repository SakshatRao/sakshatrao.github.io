const frontpage_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
  
      if (entry.isIntersecting) {
        entry.target.classList.add('frontpage_img_animation');
        return;
      }
    });
});
frontpage_observer.observe(document.querySelector('#frontpage_img'));

const frontpage_text1_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
  
      if (entry.isIntersecting) {
        entry.target.classList.add('frontpage_text1_animation');
        return;
      }
    });
});
frontpage_text1_observer.observe(document.querySelector('.frontpage_text1'));

const frontpage_text2_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
  
      if (entry.isIntersecting) {
        entry.target.classList.add('frontpage_text2_animation');
        return;
      }
    });
});
frontpage_text2_observer.observe(document.querySelector('.frontpage_text2'));






const experience1_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const about = entry.target.querySelector('.timeline_point1');
        if (entry.isIntersecting) {
            about.classList.add('experience_box1_animation');
            return;
        }
    });
});
experience1_observer.observe(document.querySelector('.experience_timeline'));

const experience2_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const about = entry.target.querySelector('.timeline_point2');
        if (entry.isIntersecting) {
            about.classList.add('experience_box2_animation');
            return;
        }
    });
});
experience2_observer.observe(document.querySelector('.experience_timeline'));

const experience3_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const about = entry.target.querySelector('.timeline_point3');
        if (entry.isIntersecting) {
            about.classList.add('experience_box3_animation');
            return;
        }
    });
});
experience3_observer.observe(document.querySelector('.experience_timeline'));

const experience4_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const about = entry.target.querySelector('.know_more');
        if (entry.isIntersecting) {
            about.classList.add('experience_button_animation');
            return;
        }
    });
});
experience4_observer.observe(document.querySelector('#experience_content'));