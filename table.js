/* ==========================================================================
   Stylish TOC JavaScript for Blogger (v1.1 - Prefixed with stoc-, Excludes Button Title)
   Host this file on GitHub Gist or similar.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- एलिमेंट चयन (stoc- प्रीफिक्स के साथ) ---
    const tocButtonWrapper = document.getElementById('stoc-toc-button-wrapper');
    const tocButtonHeader = document.getElementById('stoc-toc-button-header');
    const tocButtonScrollbox = document.getElementById('stoc-toc-button-scrollbox');
    const tocButtonList = document.getElementById('stoc-toc-button-list');
    const buttonScrollIndicator = document.getElementById('stoc-button-scroll-indicator');
    const floatingTocIcon = document.getElementById('stoc-floating-toc-icon');
    const tocSidebar = document.getElementById('stoc-toc-icon-sidebar');
    const tocSidebarInternalClose = document.getElementById('stoc-toc-sidebar-internal-close');
    const tocSidebarExternalClose = document.getElementById('stoc-toc-sidebar-external-close');
    const tocSidebarList = document.getElementById('stoc-toc-icon-sidebar-list');
    const tocSidebarScrollbox = document.getElementById('stoc-toc-icon-sidebar-scrollbox');
    const sidebarScrollIndicator = document.getElementById('stoc-sidebar-scroll-indicator');

    // --- ब्लॉगर पोस्ट कंटेंट एरिया का चयन ---
    // !!! महत्वपूर्ण: अपनी थीम के अनुसार सही सेलेक्टर डालें !!!
    const postContentArea = document.querySelector('.post-body.entry-content'); // <-- आपकी थीम के अनुसार एडजस्ट करें! '.post-body' या अन्य

    // --- राज्य चर ---
    let currentlyHighlightedElements = [];
    let highlightTimeout = null;
    let tocButtonObserver = null;
    let hasHeadings = false;

    // --- कॉन्फ़िगरेशन ---
    const headingIcons = {
        2: 'fas fa-layer-group', 3: 'fas fa-stream', 4: 'fas fa-circle-dot',
        5: 'fas fa-minus', 6: 'fas fa-chevron-right'
    };
    const scrollOffset = 70; // Adjust based on your fixed header height
    const highlightDurationFallback = 6000; // ms
    const clickEffectDuration = 400; // ms

    // --- प्रारंभिक जांच ---
    if (!tocButtonList || !tocSidebarList || !postContentArea || !tocButtonWrapper || !floatingTocIcon || !tocSidebar) {
        console.warn("Stylish TOC Error: आवश्यक TOC तत्व या पोस्ट कंटेंट एरिया नहीं मिला। कृपया JavaScript में 'postContentArea' सेलेक्टर जांचें। वर्तमान में सेट है:", postContentArea ? postContentArea.tagName + (postContentArea.className ? '.' + postContentArea.className.split(' ').join('.') : '') + (postContentArea.id ? '#' + postContentArea.id : '') : "नहीं मिला");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        return;
    }

    // --- हेडिंग्स से TOC बनाएं ---
    // H3 को चुनें लेकिन #stoc-toc-button-header-title ID वाले H3 को अनदेखा करें
    const headings = postContentArea.querySelectorAll('h2, h3:not(#stoc-toc-button-header-title), h4, h5, h6'); // <<<--- यहाँ परिवर्तन है
    const fragmentButton = document.createDocumentFragment();
    const fragmentSidebar = document.createDocumentFragment();

    headings.forEach((heading) => {
        // Skip empty headings
        if (!heading.textContent?.trim()) {
            return;
        }

        // Skip headings within the TOC button itself (double check, though :not should handle it)
        if (heading.closest('#stoc-toc-button-wrapper')) {
             console.log("Skipping heading inside button wrapper:", heading); // डिबगिंग के लिए
             return;
        }


        hasHeadings = true;
        let id = heading.id;

        // Generate unique ID if missing
        if (!id) {
            id = 'stoc_' + (heading.textContent || 'heading').trim().toLowerCase()
                   .replace(/[^\w\s-]/g, '') // Remove non-word chars except space/hyphen
                   .replace(/\s+/g, '-') // Replace spaces with hyphens
                   .replace(/-+/g, '-'); // Replace multiple hyphens with single

            // Ensure uniqueness
            let counter = 1;
            let originalId = id;
            while (document.getElementById(id)) {
                id = `${originalId}-${counter}`;
                counter++;
            }
            heading.id = id; // Assign the generated ID back to the heading
        }

        const level = parseInt(heading.tagName.substring(1));
        const linkText = heading.textContent.trim();
        const iconClass = headingIcons[level] || 'fas fa-circle'; // Default icon

        // Create list items for both TOCs
        [fragmentButton, fragmentSidebar].forEach(fragment => {
            const listItem = document.createElement('li');
            listItem.className = `stoc-toc-list-item level-${level}`;

            const link = document.createElement('a');
            link.href = `#${id}`;
            link.dataset.targetId = id; // Store target ID for easy retrieval

            const iconSpan = document.createElement('span');
            iconSpan.className = 'stoc-toc-item-icon';
            iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;

            const textSpan = document.createElement('span');
            textSpan.className = 'stoc-toc-item-text';
            textSpan.textContent = linkText;

            link.appendChild(iconSpan);
            link.appendChild(textSpan);
            listItem.appendChild(link);
            fragment.appendChild(listItem);
        });
    });

    // Append generated TOCs to the respective lists
    tocButtonList.appendChild(fragmentButton);
    tocSidebarList.appendChild(fragmentSidebar);

    // Hide TOCs if no valid headings were found
    if (!hasHeadings) {
        console.warn("Stylish TOC: पोस्ट में कोई H2-H6 हेडिंग नहीं मिली (बटन हेडर को छोड़कर)। TOC छिपाया जा रहा है।");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
    } else {
        // Initialize visibility checks and observers only if headings exist
        checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
        checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
        setupTocButtonObserver();
        setInitialButtonTocState();
    }

    // --- बटन TOC कार्यक्षमता ---
    function toggleButtonToc() {
        const isCollapsed = tocButtonWrapper.classList.toggle('collapsed');
        tocButtonWrapper.classList.toggle('expanded', !isCollapsed);
        tocButtonHeader.setAttribute('aria-expanded', String(!isCollapsed));
        if (!isCollapsed) {
            setTimeout(() => checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator), 50);
            tocButtonScrollbox.focus();
        } else {
            tocButtonHeader.focus();
        }
    }

    function setInitialButtonTocState() {
        tocButtonWrapper.classList.add('collapsed');
        tocButtonWrapper.classList.remove('expanded');
        tocButtonHeader.setAttribute('aria-expanded', 'false');
        if(buttonScrollIndicator) buttonScrollIndicator.classList.remove('visible');
    }

    if (tocButtonHeader) {
        tocButtonHeader.addEventListener('click', toggleButtonToc);
        tocButtonHeader.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleButtonToc();
            }
        });
    }

    // --- फ्लोटिंग आइकन दृश्यता (Intersection Observer) ---
    function setupTocButtonObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn("IntersectionObserver समर्थित नहीं है। फ्लोटिंग TOC आइकन हमेशा दिख सकता है (यदि हेडिंग्स हैं)।");
             if(floatingTocIcon && hasHeadings) floatingTocIcon.classList.add('visible');
            return;
        }

        const observerOptions = { root: null, rootMargin: '0px', threshold: 0 };

        tocButtonObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && !tocSidebar.classList.contains('visible')) {
                     if(floatingTocIcon) floatingTocIcon.classList.add('visible');
                } else {
                     if(floatingTocIcon) floatingTocIcon.classList.remove('visible');
                }
            });
        }, observerOptions);

        tocButtonObserver.observe(tocButtonWrapper);
    }

    // --- साइडबार TOC कार्यक्षमता ---
    function openSidebar() {
        tocSidebar.classList.add('visible');
        tocSidebar.setAttribute('aria-hidden', 'false');
        document.body.classList.add('stoc-toc-sidebar-open');
        if(tocSidebarExternalClose) tocSidebarExternalClose.classList.add('visible');
         if(floatingTocIcon) floatingTocIcon.classList.remove('visible');

        checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
        setTimeout(() => tocSidebarInternalClose?.focus(), 50);

         setTimeout(() => {
             document.addEventListener('click', handleOutsideSidebarClick, true);
         }, 100);
    }

    function closeSidebar() {
        tocSidebar.classList.remove('visible');
        tocSidebar.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('stoc-toc-sidebar-open');
        if(tocSidebarExternalClose) tocSidebarExternalClose.classList.remove('visible');

        const buttonRect = tocButtonWrapper.getBoundingClientRect();
        if (buttonRect.bottom < 0 || buttonRect.top > window.innerHeight) {
             if(floatingTocIcon) floatingTocIcon.classList.add('visible');
        }

        document.removeEventListener('click', handleOutsideSidebarClick, true);

        if(floatingTocIcon && document.activeElement === tocSidebarInternalClose) {
             floatingTocIcon.focus();
        } else if (tocSidebarExternalClose && document.activeElement === tocSidebarExternalClose){
             floatingTocIcon?.focus();
        }
    }

    function handleOutsideSidebarClick(event) {
         if (tocSidebar.classList.contains('visible') &&
             !tocSidebar.contains(event.target) &&
             event.target !== floatingTocIcon &&
             !floatingTocIcon?.contains(event.target) &&
             event.target !== tocSidebarExternalClose &&
             !tocSidebarExternalClose?.contains(event.target))
         {
            closeSidebar();
         }
    }

    if (floatingTocIcon) {
        floatingTocIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            openSidebar();
        });
    }
    if (tocSidebarInternalClose) {
        tocSidebarInternalClose.addEventListener('click', closeSidebar);
    }
    if (tocSidebarExternalClose) {
        tocSidebarExternalClose.addEventListener('click', closeSidebar);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && tocSidebar.classList.contains('visible')) {
            closeSidebar();
        }
    });

    // --- TOC लिंक क्लिक हैंडलिंग और हाइलाइटिंग ---
    function handleTocLinkClick(event) {
        const linkElement = event.target.closest('a');
        if (linkElement && linkElement.dataset.targetId) {
            event.preventDefault();
            const targetId = linkElement.dataset.targetId;
            const targetElement = document.getElementById(targetId);

            linkElement.classList.add('stoc-toc-link-clicked');
            setTimeout(() => {
                linkElement.classList.remove('stoc-toc-link-clicked');
            }, clickEffectDuration);

            if (targetElement) {
                if (tocSidebar.classList.contains('visible')) {
                    closeSidebar();
                    setTimeout(() => { scrollToElement(targetElement); }, 300);
                } else {
                    scrollToElement(targetElement);
                }
            } else {
                console.warn(`Stylish TOC: लक्ष्य तत्व आईडी के साथ नहीं मिला: ${targetId}`);
            }
        }
    }

    function scrollToElement(element) {
         const elementRect = element.getBoundingClientRect();
         const absoluteElementTop = elementRect.top + window.pageYOffset;
         const offsetPosition = absoluteElementTop - scrollOffset;

         window.scrollTo({ top: offsetPosition, behavior: 'smooth' });

         setTimeout(() => {
             applyHighlight(element);
         }, 700);
    }

    if (tocButtonList) tocButtonList.addEventListener('click', handleTocLinkClick);
    if (tocSidebarList) tocSidebarList.addEventListener('click', handleTocLinkClick);

    // --- हेडिंग और पैराग्राफ हाइलाइटिंग ---
    function applyHighlight(headingElement) {
        clearHighlight();

        headingElement.classList.add('stoc-toc-target-heading');
        currentlyHighlightedElements.push(headingElement);

        let nextElem = headingElement.nextElementSibling;
        const headingLevel = parseInt(headingElement.tagName.substring(1));

        while (nextElem) {
            const tagName = nextElem.tagName.toUpperCase();
            if (tagName.startsWith('H')) {
                const nextLevel = parseInt(tagName.substring(1));
                if (nextLevel <= headingLevel) { break; }
            }
            if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE', 'PRE', 'TABLE'].includes(tagName)) {
                nextElem.classList.add('stoc-toc-target-paragraph');
                currentlyHighlightedElements.push(nextElem);
            }
            else if (['BR', 'HR', 'SCRIPT', 'STYLE'].includes(tagName)) { /* Skip */ }
            else if (nextElem.offsetWidth > 0 && nextElem.offsetHeight > 0 && getComputedStyle(nextElem).display !== 'inline') { /* Stop? */ }

            nextElem = nextElem.nextElementSibling;
        }

         const cssDuration = getComputedStyle(document.documentElement).getPropertyValue('--stoc-popup-highlight-duration');
         let highlightDurationMs = highlightDurationFallback;
         if (cssDuration) {
             try {
                 const durationValue = parseFloat(cssDuration);
                 if (cssDuration.toLowerCase().includes('ms')) {
                     highlightDurationMs = durationValue;
                 } else if (cssDuration.toLowerCase().includes('s')) {
                     highlightDurationMs = durationValue * 1000;
                 }
             } catch (e) {
                 console.warn("Stylish TOC: Could not parse --stoc-popup-highlight-duration CSS variable.", e);
             }
         }

        highlightTimeout = setTimeout(() => {
            currentlyHighlightedElements.forEach(el => {
                el.classList.add('fading-out');
                setTimeout(() => {
                    el.classList.remove('stoc-toc-target-heading', 'stoc-toc-target-paragraph', 'fading-out');
                }, 500);
            });
            currentlyHighlightedElements = [];
        }, highlightDurationMs - 500);
    }

    function clearHighlight() {
        if (highlightTimeout) clearTimeout(highlightTimeout);
        highlightTimeout = null;
        currentlyHighlightedElements.forEach(el => {
            el.classList.remove('stoc-toc-target-heading', 'stoc-toc-target-paragraph', 'fading-out');
        });
        currentlyHighlightedElements = [];
    }

    // --- स्क्रॉल इंडिकेटर दृश्यता ---
    function checkScrollIndicatorVisibility(scrollbox, indicator) {
        if (!scrollbox || !indicator) return;
        let isVisible = indicator.classList.contains('visible');

        function check() {
            if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) {
                if (isVisible) { indicator.classList.remove('visible'); isVisible = false; }
                return;
            }
            const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 5;
            const isNearTop = scrollbox.scrollTop < 20;
            const shouldBeVisible = isScrollable && isNearTop;
            if (shouldBeVisible && !isVisible) { indicator.classList.add('visible'); isVisible = true; }
            else if (!shouldBeVisible && isVisible) { indicator.classList.remove('visible'); isVisible = false; }
        }

        setTimeout(check, 250);
        scrollbox.addEventListener('scroll', check, { passive: true });
         if (scrollbox === tocButtonScrollbox && tocButtonHeader) {
             tocButtonHeader.addEventListener('click', () => { setTimeout(check, 600); });
         }
         if (scrollbox === tocSidebarScrollbox && floatingTocIcon) {
             floatingTocIcon.addEventListener('click', () => { setTimeout(check, 550); });
         }
         window.addEventListener('resize', check, { passive: true });
    }
});
