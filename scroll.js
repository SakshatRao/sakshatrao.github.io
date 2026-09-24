(function () {
    const profiles = document.getElementById('profiles');
    const profileViewport = profiles ? profiles.querySelector('.profile_viewport') : null;
    const profileToggles = profiles ? profiles.querySelectorAll('.profile_toggle') : [];
    const chapterLinks = profiles ? Array.from(profiles.querySelectorAll('.chapter_nav a')) : [];
    const profileChapterIds = {
        work: ['experience', 'skills', 'achievements', 'projects', 'contact'],
        personal: ['about', 'music', 'sports', 'writing', 'dance', 'contact']
    };
    const returnSectionStorageKey = 'sakshatProfileReturnSection';
    let activeChapterFrame = null;
    let initialPositionHandled = false;
    let returnSectionLandingHandled = false;
    let resolvedReturnSectionHash = null;

    if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }

    function resetFrontpageScroll() {
        if (returnSectionLandingHandled) {
            return;
        }

        if (initialSectionHash() || !document.getElementById('frontpage')) {
            return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    resetFrontpageScroll();

    function activeProfile() {
        return profiles ? profiles.dataset.activeProfile || 'work' : 'work';
    }

    function activePanel() {
        return profiles ? profiles.querySelector(`[data-profile-panel="${activeProfile()}"]`) : null;
    }

    function updateProfileHeight() {
        const panel = activePanel();
        if (!profileViewport || !panel) {
            return;
        }
        profileViewport.style.height = `${panel.offsetHeight}px`;
    }

    function updateProfileButtons(profile) {
        profileToggles.forEach((toggle) => {
            const isActive = toggle.dataset.profileTarget === profile;
            toggle.classList.toggle('active', isActive);
            toggle.setAttribute('aria-selected', String(isActive));
        });
    }

    function setActiveChapter(hash) {
        const profile = activeProfile();

        chapterLinks.forEach((link) => {
            const isActive = link.dataset.profileTarget === profile && link.getAttribute('href') === hash;
            link.classList.toggle('active', isActive);

            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function updateActiveChapter() {
        if (!profiles) {
            return;
        }

        if (window.scrollY + 4 < profiles.offsetTop) {
            setActiveChapter('');
            return;
        }

        const profile = activeProfile();
        const ids = profileChapterIds[profile] || profileChapterIds.work;
        const chrome = profiles.querySelector('.profile_chrome');
        const chromeHeight = chrome ? chrome.getBoundingClientRect().height : 0;
        const marker = chromeHeight + (window.innerHeight * 0.34);
        let currentId = ids[0];

        ids.forEach((id) => {
            const section = document.getElementById(id);
            if (!section) {
                return;
            }

            const rect = section.getBoundingClientRect();
            if (rect.top <= marker) {
                currentId = id;
            }
        });

        setActiveChapter(`#${currentId}`);
    }

    function scheduleActiveChapterUpdate() {
        if (activeChapterFrame !== null) {
            return;
        }

        activeChapterFrame = requestAnimationFrame(() => {
            activeChapterFrame = null;
            updateActiveChapter();
        });
    }

    function setProfile(profile, options = {}) {
        if (!profiles || (profile !== 'work' && profile !== 'personal')) {
            return;
        }

        const currentProfile = activeProfile();
        const profileTop = profiles.offsetTop;
        const localScroll = Math.max(0, window.scrollY - profileTop);
        profiles.dataset.activeProfile = profile;
        updateProfileButtons(profile);

        const isSameProfileSmoothScroll = currentProfile === profile && Boolean(options.scrollToHash) && options.scrollBehavior !== 'auto';
        if (!isSameProfileSmoothScroll) {
            setActiveChapter(options.scrollToHash || firstProfileHash(profile));
        }

        requestAnimationFrame(() => {
            updateProfileHeight();

            if (options.scrollToProfiles) {
                window.scrollTo({ top: profiles.offsetTop, behavior: 'smooth' });
                return;
            }

            if (options.preserveScroll && window.scrollY >= profileTop) {
                const panel = activePanel();
                const maxLocal = Math.max(0, (panel ? panel.offsetHeight : 0) - window.innerHeight);
                const targetTop = profileTop + Math.min(localScroll, maxLocal);

                window.scrollTo({
                    top: targetTop,
                    behavior: 'auto'
                });

                requestAnimationFrame(() => window.scrollTo({
                    top: targetTop,
                    behavior: 'auto'
                }));
            }

            if (options.scrollToHash) {
                scrollToHash(options.scrollToHash, options.scrollBehavior || 'smooth');
            } else {
                updateActiveChapter();
            }
        });
    }

    function scrollToHash(hash, behavior = 'smooth') {
        const target = document.querySelector(hash);
        if (!target) {
            return;
        }

        if (profiles && hash === '#profiles') {
            window.scrollTo({ top: profiles.offsetTop, behavior });
            return;
        }

        if (profiles && target.closest('#profiles')) {
            const chrome = profiles.querySelector('.profile_chrome');
            const chromeHeight = chrome ? chrome.getBoundingClientRect().height : 0;
            const targetTop = window.scrollY + target.getBoundingClientRect().top - chromeHeight;
            window.scrollTo({ top: Math.max(0, targetTop), behavior });
            return;
        }

        target.scrollIntoView({ behavior, block: 'start' });
    }

    function firstProfileHash(profile) {
        return profile === 'personal' ? '#about' : '#experience';
    }

    function returnSectionHash() {
        if (resolvedReturnSectionHash !== null) {
            return resolvedReturnSectionHash;
        }

        const params = new URLSearchParams(window.location.search);
        let section = (params.get('section') || '').replace(/^#/, '').trim();

        if (!section) {
            try {
                section = (window.sessionStorage.getItem(returnSectionStorageKey) || '').replace(/^#/, '').trim();
            } catch (error) {
                section = '';
            }
        }

        if (!section && !isReloadNavigation()) {
            section = sectionFromReferrer();
        }

        if (!section || !/^[A-Za-z][\w-]*$/.test(section) || !document.getElementById(section)) {
            resolvedReturnSectionHash = '';
            return '';
        }

        resolvedReturnSectionHash = `#${section}`;
        clearStoredReturnSection();
        return resolvedReturnSectionHash;
    }

    function clearStoredReturnSection() {
        try {
            window.sessionStorage.removeItem(returnSectionStorageKey);
        } catch (error) {
            // Storage can be blocked in private contexts.
        }
    }

    function isReloadNavigation() {
        const navigationEntry = window.performance?.getEntriesByType?.('navigation')?.[0];

        if (navigationEntry) {
            return navigationEntry.type === 'reload';
        }

        return window.performance?.navigation?.type === 1;
    }

    function sectionFromReferrer() {
        if (!document.referrer) {
            return '';
        }

        try {
            const referrer = new URL(document.referrer);

            if (referrer.origin !== window.location.origin) {
                return '';
            }

            const callerPage = referrer.pathname.split('/').pop();
            const callerSections = {
                'experience.html': 'experience',
                'skills.html': 'skills',
                'achievements.html': 'achievements',
                'projects.html': 'projects',
                'personal.html': 'about'
            };

            return callerSections[callerPage] || '';
        } catch (error) {
            return '';
        }
    }

    function initialSectionHash() {
        return returnSectionHash() || window.location.hash;
    }

    function cleanReturnSectionUrl() {
        if (!returnSectionHash() || !window.history.replaceState) {
            return;
        }

        clearStoredReturnSection();
        window.history.replaceState(null, document.title, `${window.location.origin}${window.location.pathname}`);
    }

    document.querySelectorAll('a[data-return-section]').forEach((link) => {
        link.addEventListener('click', () => {
            const section = (link.dataset.returnSection || '').replace(/^#/, '').trim();

            if (!section || !/^[A-Za-z][\w-]*$/.test(section)) {
                return;
            }

            try {
                window.sessionStorage.setItem(returnSectionStorageKey, section);
            } catch (error) {
                const separator = link.href.includes('?') ? '&' : '?';
                link.href = `${link.href}${separator}section=${encodeURIComponent(section)}`;
            }
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const hash = link.getAttribute('href');
            const profile = link.dataset.profileTarget;

            if (!hash || hash === '#') {
                return;
            }

            event.preventDefault();

            if (profile) {
                setProfile(profile, {
                    scrollToHash: hash === '#profiles' ? firstProfileHash(profile) : hash
                });
                return;
            }

            requestAnimationFrame(() => scrollToHash(hash));
        });
    });

    document.querySelectorAll('button[data-profile-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const profile = button.dataset.profileTarget;
            setProfile(profile, { scrollToHash: firstProfileHash(profile) });
        });
    });

    if (profiles) {
        let touchStartX = 0;
        let touchStartY = 0;
        let pointerStartX = 0;
        let pointerStartY = 0;
        let pointerStarted = false;

        profiles.addEventListener('touchstart', (event) => {
            const touch = event.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });

        profiles.addEventListener('touchend', (event) => {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
                return;
            }

            setProfile(deltaX < 0 ? 'personal' : 'work', { preserveScroll: true });
        }, { passive: true });

        profiles.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) {
                return;
            }

            pointerStarted = true;
            pointerStartX = event.clientX;
            pointerStartY = event.clientY;
        });

        profiles.addEventListener('pointerup', (event) => {
            if (!pointerStarted) {
                return;
            }

            pointerStarted = false;
            const deltaX = event.clientX - pointerStartX;
            const deltaY = event.clientY - pointerStartY;

            if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
                return;
            }

            setProfile(deltaX < 0 ? 'personal' : 'work', { preserveScroll: true });
        });
    }

    function playVideo(card) {
        const videoId = card.dataset.videoId;
        if (!videoId || card.classList.contains('is-playing')) {
            return;
        }

        const title = card.dataset.videoTitle || 'YouTube video';
        const start = card.dataset.videoStart;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0${start ? `&start=${encodeURIComponent(start)}` : ''}`;
        iframe.title = title;
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;

        const wrapperLink = card.closest('a.video_link');
        if (wrapperLink) {
            wrapperLink.replaceWith(card);
        }

        card.classList.add('is-playing');
        card.removeAttribute('role');
        card.removeAttribute('tabindex');
        card.replaceChildren(iframe);
    }

    function youtubeVideoId(url) {
        try {
            const parsed = new URL(url, window.location.href);
            const host = parsed.hostname.replace(/^www\./, '');

            if (host === 'youtu.be') {
                return parsed.pathname.split('/').filter(Boolean)[0] || null;
            }

            if (host.endsWith('youtube.com')) {
                if (parsed.pathname.startsWith('/embed/')) {
                    return parsed.pathname.split('/').filter(Boolean)[1] || null;
                }
                return parsed.searchParams.get('v');
            }
        } catch (error) {
            return null;
        }

        return null;
    }

    function youtubeStartTime(url) {
        try {
            const parsed = new URL(url, window.location.href);
            const raw = parsed.searchParams.get('t') || parsed.searchParams.get('start');

            if (!raw) {
                return '';
            }

            const match = raw.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
            if (!match) {
                return String(parseInt(raw, 10) || '');
            }

            const hours = parseInt(match[1] || '0', 10);
            const minutes = parseInt(match[2] || '0', 10);
            const seconds = parseInt(match[3] || '0', 10);
            return String((hours * 3600) + (minutes * 60) + seconds);
        } catch (error) {
            return '';
        }
    }

    function loadXWidgets() {
        if (window.twttr?.widgets) {
            return Promise.resolve(window.twttr);
        }

        if (window.__xWidgetsPromise) {
            return window.__xWidgetsPromise;
        }

        window.__xWidgetsPromise = new Promise((resolve, reject) => {
            const twttr = window.twttr || {};
            twttr._e = twttr._e || [];
            twttr.ready = twttr.ready || function onReady(callback) {
                twttr._e.push(callback);
            };
            window.twttr = twttr;
            twttr.ready(resolve);

            if (document.getElementById('twitter-wjs')) {
                return;
            }

            const script = document.createElement('script');
            script.id = 'twitter-wjs';
            script.async = true;
            script.src = 'https://platform.x.com/widgets.js';
            script.charset = 'utf-8';
            script.onerror = reject;
            (document.head || document.body).appendChild(script);
        });

        return window.__xWidgetsPromise;
    }

    function showXFallback(card, tweetUrl) {
        const fallback = document.createElement('a');
        fallback.className = 'x_embed_fallback';
        fallback.href = tweetUrl;
        fallback.target = '_blank';
        fallback.rel = 'noopener noreferrer';
        fallback.textContent = 'Open the submission video on X';
        card.replaceChildren(fallback);
    }

    function fitXTweetVideo(card) {
        const iframe = card.querySelector('iframe');

        if (!iframe) {
            return;
        }

        const iframeRect = iframe.getBoundingClientRect();
        const cardWidth = Math.min(card.clientWidth || iframeRect.width || 560, 560);
        const iframeWidth = Math.round(iframeRect.width || Number(iframe.getAttribute('width')) || cardWidth);
        const mediaHeight = Math.round(cardWidth * 9 / 16);
        const iframeHeight = Math.round(iframeRect.height || Number(iframe.getAttribute('height')) || mediaHeight);
        const isDesktop = window.matchMedia('(min-width: 769px)').matches;

        if (iframeHeight > mediaHeight * 1.25) {
            card.classList.add('is-video-cropped');
            card.style.height = `${mediaHeight}px`;

            if (isDesktop) {
                const fillScale = Math.max(1.2, cardWidth / Math.max(iframeWidth, 1));
                card.classList.add('is-desktop-video-fill');
                iframe.style.transformOrigin = 'bottom center';
                iframe.style.transform = fillScale > 1.01 ? `scale(${fillScale})` : '';
            } else {
                const cropOffset = Math.max(0, iframeHeight - mediaHeight);
                card.classList.remove('is-desktop-video-fill');
                iframe.style.transformOrigin = 'top center';
                iframe.style.transform = `translateY(-${cropOffset}px)`;
            }
        } else {
            card.classList.remove('is-video-cropped', 'is-desktop-video-fill');
            card.style.height = '';
            iframe.style.transformOrigin = '';
            iframe.style.transform = '';
        }
    }

    function scheduleXTweetFit(card) {
        [300, 800, 1500, 2500, 4000].forEach((delay) => {
            window.setTimeout(() => fitXTweetVideo(card), delay);
        });

        if (card.dataset.xResizeFitBound) {
            return;
        }

        card.dataset.xResizeFitBound = 'true';
        window.addEventListener('resize', () => fitXTweetVideo(card), { passive: true });
    }

    function playXTweet(card) {
        const tweetId = card.dataset.xTweetId;
        const tweetUrl = card.dataset.xTweetUrl || `https://x.com/i/status/${tweetId}`;

        if (!tweetId || card.classList.contains('is-playing')) {
            return;
        }

        const wrapperLink = card.closest('a.video_link');
        if (wrapperLink) {
            wrapperLink.replaceWith(card);
        }

        card.classList.add('is-playing');
        card.removeAttribute('role');
        card.removeAttribute('tabindex');

        const loading = document.createElement('div');
        loading.className = 'x_embed_loading';
        loading.textContent = 'Loading X video...';
        card.replaceChildren(loading);

        loadXWidgets()
            .then((loadedTwttr) => {
                const widgets = loadedTwttr?.widgets || window.twttr?.widgets;
                const blockquote = document.createElement('blockquote');
                blockquote.className = 'twitter-tweet';
                blockquote.dataset.mediaMaxWidth = '560';
                blockquote.dataset.theme = 'dark';
                blockquote.dataset.dnt = 'true';
                blockquote.dataset.conversation = 'none';

                const link = document.createElement('a');
                link.href = tweetUrl;
                link.textContent = card.dataset.xTweetTitle || 'Smart India Hackathon 2020 submission video';
                blockquote.appendChild(link);

                card.replaceChildren(blockquote);

                if (widgets?.load) {
                    widgets.load(card);
                    scheduleXTweetFit(card);
                } else {
                    showXFallback(card, tweetUrl);
                }
            })
            .catch(() => showXFallback(card, tweetUrl));
    }

    document.querySelectorAll('[data-music-carousel]').forEach((carousel) => {
        const cards = Array.from(carousel.querySelectorAll('[data-carousel-card]'));
        const prevButton = carousel.querySelector('.carousel_button_prev');
        const nextButton = carousel.querySelector('.carousel_button_next');
        let activeIndex = Math.max(0, cards.findIndex((card) => card.classList.contains('is-active')));

        function updateCarousel() {
            const count = cards.length;
            const previousIndex = (activeIndex - 1 + count) % count;
            const nextIndex = (activeIndex + 1) % count;

            cards.forEach((card, index) => {
                const isActive = index === activeIndex;
                const isPrevious = index === previousIndex;
                const isNext = index === nextIndex;
                const isVisible = isActive || isPrevious || isNext;

                card.classList.toggle('is-active', isActive);
                card.classList.toggle('is-prev', isPrevious);
                card.classList.toggle('is-next', isNext);
                card.classList.toggle('is-hidden', !isVisible);
                card.setAttribute('aria-hidden', String(!isVisible));

                if (!card.classList.contains('is-playing')) {
                    card.setAttribute('role', 'button');
                    card.setAttribute('tabindex', isVisible ? '0' : '-1');
                }
            });
        }

        function rotate(direction) {
            activeIndex = (activeIndex + direction + cards.length) % cards.length;
            updateCarousel();
        }

        prevButton?.addEventListener('click', () => rotate(-1));
        nextButton?.addEventListener('click', () => rotate(1));

        cards.forEach((card, index) => {
            function activateOrPlay() {
                if (index !== activeIndex) {
                    activeIndex = index;
                    updateCarousel();
                    return;
                }

                playVideo(card);
            }

            card.addEventListener('click', activateOrPlay);
            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                activateOrPlay();
            });
        });

        updateCarousel();
    });

    document.querySelectorAll('[data-sports-gallery]').forEach((gallery) => {
        const image = gallery.querySelector('.sports_photo');
        const dots = Array.from(gallery.querySelectorAll('.sports_gallery_dots span'));
        const images = (gallery.dataset.galleryImages || '')
            .split(',')
            .map((src) => src.trim())
            .filter(Boolean);
        const altBase = gallery.dataset.galleryAlt || image?.alt || 'Sports photo';
        let activeIndex = 0;

        if (!image || images.length <= 1) {
            return;
        }

        function updateGallery() {
            image.src = images[activeIndex];
            image.alt = `${altBase} ${activeIndex + 1}`;
            gallery.setAttribute('aria-label', `${altBase}. Photo ${activeIndex + 1} of ${images.length}. Activate to show next photo.`);

            dots.forEach((dot, index) => {
                dot.classList.toggle('is-active', index === activeIndex);
            });
        }

        function nextPhoto() {
            activeIndex = (activeIndex + 1) % images.length;
            updateGallery();
        }

        gallery.addEventListener('click', nextPhoto);
        gallery.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            nextPhoto();
        });

        updateGallery();
    });

    document.querySelectorAll('.video_embed_card[data-video-id]:not([data-carousel-card])').forEach((card) => {
        card.addEventListener('click', () => playVideo(card));
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            playVideo(card);
        });
    });

    document.querySelectorAll('.video_link').forEach((link) => {
        const videoId = youtubeVideoId(link.href);
        const preview = link.querySelector('.video_preview_box');

        if (!videoId || !preview) {
            return;
        }

        preview.dataset.videoId = videoId;
        preview.dataset.videoStart = youtubeStartTime(link.href);
        preview.dataset.videoTitle = preview.querySelector('.video_info h3')?.textContent?.trim() || 'YouTube video';
        preview.classList.add('youtube_embed_card');
        preview.style.setProperty('--youtube-thumb', `url("https://img.youtube.com/vi/${videoId}/hqdefault.jpg")`);

        link.addEventListener('click', (event) => {
            event.preventDefault();
            playVideo(preview);
        });

        link.addEventListener('keydown', (event) => {
            if (event.key !== ' ') {
                return;
            }

            event.preventDefault();
            playVideo(preview);
        });
    });

    document.querySelectorAll('.x_video_link[data-x-tweet-id]').forEach((link) => {
        const preview = link.querySelector('.x_embed_card');

        if (!preview) {
            return;
        }

        preview.dataset.xTweetId = link.dataset.xTweetId;
        preview.dataset.xTweetUrl = link.href;

        link.addEventListener('click', (event) => {
            event.preventDefault();
            playXTweet(preview);
        });

        link.addEventListener('keydown', (event) => {
            if (event.key !== ' ') {
                return;
            }

            event.preventDefault();
            playXTweet(preview);
        });
    });

    const poemModal = document.querySelector('[data-poem-modal]');
    const poemModalTitle = poemModal ? poemModal.querySelector('[data-poem-modal-title]') : null;
    const poemModalBody = poemModal ? poemModal.querySelector('[data-poem-modal-body]') : null;
    let lastFocusedPoemCard = null;

    function escapeHTML(value) {
        return value.replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character]));
    }

    function poemContentToHTML(content) {
        return content
            .trim()
            .split(/\n{2,}/)
            .map((stanza) => stanza.trim())
            .filter(Boolean)
            .map((stanza) => `<p>${escapeHTML(stanza).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    function parsePoemText(text, source) {
        const normalizedText = text.replace(/\r\n?/g, '\n').trim();
        const parts = normalizedText.split(/\n---\n/);

        if (parts.length < 3) {
            throw new Error(`Invalid poem format: ${source}`);
        }

        return {
            title: parts[0].trim(),
            description: parts[1].trim(),
            content: parts.slice(2).join('\n---\n').trim(),
            type: source.endsWith('/no_regrets.txt') ? 'Short Story' : 'Poem'
        };
    }

    function createPoemCard(poem) {
        const card = document.createElement('article');
        const kicker = document.createElement('span');
        const title = document.createElement('h5');
        const description = document.createElement('p');
        const fullText = document.createElement('div');

        card.className = 'poem_card is-hidden';
        card.dataset.poemCard = '';
        card.tabIndex = -1;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Open ${poem.title}`);

        kicker.className = 'poem_card_kicker';
        kicker.textContent = poem.type;
        title.textContent = poem.title;
        description.className = 'poem_card_excerpt';
        description.textContent = poem.description;
        fullText.className = 'poem_full_text';
        fullText.hidden = true;
        fullText.innerHTML = poemContentToHTML(poem.content);

        card.append(kicker, title, description, fullText);
        return card;
    }

    function openPoem(card, focusReturn = card) {
        if (!poemModal || !poemModalTitle || !poemModalBody) {
            return;
        }

        lastFocusedPoemCard = focusReturn;
        poemModalTitle.textContent = card.querySelector('h5')?.textContent?.trim() || 'Writing';
        poemModalBody.innerHTML = card.querySelector('.poem_full_text')?.innerHTML || '';
        poemModal.hidden = false;
        poemModalBody.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        requestAnimationFrame(() => poemModalBody.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
        document.documentElement.classList.add('poem_modal_open');
        document.body.classList.add('poem_modal_open');
        poemModal.querySelector('[data-poem-close]')?.focus();
    }

    function closePoem() {
        if (!poemModal || poemModal.hidden) {
            return;
        }

        poemModal.hidden = true;
        document.documentElement.classList.remove('poem_modal_open');
        document.body.classList.remove('poem_modal_open');
        lastFocusedPoemCard?.focus();
    }

    document.querySelectorAll('[data-poem-close]').forEach((button) => {
        button.addEventListener('click', closePoem);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePoem();
        }
    });

    function setupPoetryCarousel(carousel, cards) {
        const prevButton = carousel.querySelector('.poetry_arrow_prev');
        const nextButton = carousel.querySelector('.poetry_arrow_next');
        const stage = carousel.querySelector('[data-poetry-stage]') || carousel.querySelector('.poetry_stage');
        let activeIndex = Math.max(0, cards.findIndex((card) => card.classList.contains('is-active')));
        let flipTimer = null;
        let flipResetTimer = null;
        let isFlipping = false;

        function poemTitle(card) {
            return card?.querySelector('h5')?.textContent?.trim() || 'Poem';
        }

        function poemDescription(card) {
            return card?.querySelector('.poem_card_excerpt')?.textContent?.trim() || '';
        }

        function createPoetryBook() {
            const book = document.createElement('div');
            const spine = document.createElement('span');
            const leftPage = document.createElement('span');
            const rightPage = document.createElement('button');
            const collection = document.createElement('span');
            const collectionTitle = document.createElement('span');
            const title = document.createElement('span');
            const description = document.createElement('span');
            const flippingSheet = document.createElement('span');

            book.className = 'poetry_book';
            rightPage.type = 'button';
            spine.className = 'poetry_book_spine';
            leftPage.className = 'poetry_book_page poetry_book_page_left';
            rightPage.className = 'poetry_book_page poetry_book_page_right';
            collection.className = 'poetry_book_collection';
            collectionTitle.className = 'poetry_book_collection_title';
            title.className = 'poetry_book_title';
            description.className = 'poetry_book_excerpt';
            flippingSheet.className = 'poetry_book_sheet';
            flippingSheet.setAttribute('aria-hidden', 'true');

            collectionTitle.textContent = 'Writing Collection';

            collection.append(collectionTitle);
            leftPage.append(collection);
            rightPage.append(title, description);
            book.append(leftPage, spine, rightPage, flippingSheet);

            rightPage.addEventListener('click', () => {
                openPoem(cards[activeIndex], rightPage);
            });

            return book;
        }

        const book = createPoetryBook();
        const bookPoemPage = book.querySelector('.poetry_book_page_right');
        const bookTitle = book.querySelector('.poetry_book_title');
        const bookExcerpt = book.querySelector('.poetry_book_excerpt');

        function updatePoetryCarousel() {
            const count = cards.length;

            if (!count) {
                prevButton?.setAttribute('disabled', '');
                nextButton?.setAttribute('disabled', '');
                return;
            }

            cards.forEach((card, index) => {
                const isActive = index === activeIndex;
                const state = isActive ? 'is-active' : 'is-hidden';
                card.classList.remove('is-far-prev', 'is-prev', 'is-active', 'is-next', 'is-far-next', 'is-hidden');
                card.classList.add(state);
                card.setAttribute('aria-hidden', 'true');
                card.setAttribute('tabindex', '-1');
                card.removeAttribute('role');
                card.removeAttribute('aria-label');
            });

            const activeCard = cards[activeIndex];
            const title = poemTitle(activeCard);
            const description = poemDescription(activeCard);
            bookTitle.textContent = title;
            bookExcerpt.textContent = description;
            bookPoemPage?.setAttribute('aria-label', `Open ${title}`);
        }

        function rotate(direction) {
            if (!cards.length || isFlipping) {
                return;
            }

            isFlipping = true;
            book.classList.remove('is-flipping-prev', 'is-flipping-next');
            book.classList.add(direction > 0 ? 'is-flipping-next' : 'is-flipping-prev');

            window.clearTimeout(flipTimer);
            window.clearTimeout(flipResetTimer);

            flipTimer = window.setTimeout(() => {
                activeIndex = (activeIndex + direction + cards.length) % cards.length;
                updatePoetryCarousel();
            }, 150);

            flipResetTimer = window.setTimeout(() => {
                book.classList.remove('is-flipping-prev', 'is-flipping-next');
                isFlipping = false;
            }, 360);
        }

        prevButton?.addEventListener('click', () => rotate(-1));
        nextButton?.addEventListener('click', () => rotate(1));

        if (stage) {
            stage.classList.add('is-book-stage');
            stage.replaceChildren(book, ...cards);
        }

        updatePoetryCarousel();
    }

    document.querySelectorAll('[data-poetry-carousel]').forEach((carousel) => {
        const stage = carousel.querySelector('[data-poetry-stage]') || carousel.querySelector('.poetry_stage');
        const poemFiles = (carousel.dataset.poemFiles || '')
            .split(',')
            .map((file) => file.trim())
            .filter(Boolean);

        if (!stage || !poemFiles.length) {
            setupPoetryCarousel(carousel, Array.from(carousel.querySelectorAll('[data-poem-card]')));
            return;
        }

        stage.setAttribute('aria-busy', 'true');

        Promise.all(poemFiles.map((file) => fetch(file)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Unable to load ${file}`);
                }

                return response.text();
            })
            .then((text) => parsePoemText(text, file))))
            .then((poems) => {
                stage.replaceChildren(...poems.map(createPoemCard));
                stage.removeAttribute('aria-busy');
                setupPoetryCarousel(carousel, Array.from(stage.querySelectorAll('[data-poem-card]')));
            })
            .catch((error) => {
                console.error(error);
                stage.removeAttribute('aria-busy');
                setupPoetryCarousel(carousel, Array.from(stage.querySelectorAll('[data-poem-card]')));
            });
    });

    document.querySelectorAll('.dance_photo_stack').forEach((stack) => {
        const photos = Array.from(stack.querySelectorAll('[data-dance-photo]'));
        let activeIndex = Math.max(0, photos.findIndex((photo) => photo.classList.contains('is-dance-active')));

        function updateDancePhotos() {
            const count = photos.length;
            const leftIndex = (activeIndex - 1 + count) % count;
            const rightIndex = (activeIndex + 1) % count;

            photos.forEach((photo, index) => {
                photo.classList.toggle('is-dance-active', index === activeIndex);
                photo.classList.toggle('is-dance-left', index === leftIndex);
                photo.classList.toggle('is-dance-right', index === rightIndex);
            });
        }

        photos.forEach((photo, index) => {
            function activatePhoto() {
                activeIndex = index;
                updateDancePhotos();
            }

            photo.addEventListener('click', activatePhoto);
            photo.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                activatePhoto();
            });
        });

        updateDancePhotos();
    });

    function profileFromHash(hash = initialSectionHash()) {
        const personalHashes = ['#about', '#about_content', '#music', '#music_content', '#sports', '#sports_content', '#writing', '#writing_content', '#dance', '#dance_content'];
        const workHashes = ['#experience', '#experience_content', '#skills', '#skills_content', '#achievements', '#achievements_content', '#projects', '#projects_content'];

        if (personalHashes.includes(hash)) {
            return 'personal';
        }
        if (workHashes.includes(hash)) {
            return 'work';
        }
        return activeProfile();
    }

    function handleInitialPosition() {
        if (initialPositionHandled) {
            return;
        }

        initialPositionHandled = true;
        const targetHash = initialSectionHash();
        const isReturnSection = Boolean(returnSectionHash());
        returnSectionLandingHandled = isReturnSection;
        const profile = profileFromHash(targetHash);
        setProfile(profile, {
            scrollToHash: targetHash || null,
            scrollBehavior: isReturnSection ? 'auto' : 'smooth'
        });
        updateProfileHeight();
        updateActiveChapter();

        if (isReturnSection) {
            requestAnimationFrame(() => requestAnimationFrame(cleanReturnSectionUrl));
        }

        if (!targetHash) {
            resetFrontpageScroll();
            requestAnimationFrame(resetFrontpageScroll);
        }
    }

    window.addEventListener('resize', () => {
        updateProfileHeight();
        updateActiveChapter();
    });
    window.addEventListener('scroll', scheduleActiveChapterUpdate, { passive: true });
    window.addEventListener('DOMContentLoaded', handleInitialPosition);
    window.addEventListener('load', () => {
        handleInitialPosition();
        updateProfileHeight();
        updateActiveChapter();
    });
    window.addEventListener('pageshow', resetFrontpageScroll);

    setProfile(profileFromHash(initialSectionHash()));
    handleInitialPosition();
})();
