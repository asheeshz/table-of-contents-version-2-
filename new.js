/* ==========================================================================
   Stylish TOC JavaScript for Blogger (v1.3 - डायनामिक इन-कंटेंट बटन और फ्लोटिंग आइकन फिक्स)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- इन-कंटेंट बटन को डायनामिक रूप से स्थापित करने का फंक्शन ---
    function createAndPlaceInContentTocButton() {
        // पहले जांचें कि क्या यह एक पोस्ट पेज है (ब्लॉगर में आमतौर पर body.item-view क्लास होती है)
        // यदि नहीं, तो इन-कंटेंट बटन बनाने की आवश्यकता नहीं है।
        if (!document.body.classList.contains('item-view') && !document.querySelector('.post-body')) {
            // यह शायद पोस्ट पेज नहीं है, या पोस्ट बॉडी नहीं मिली।
            return false;
        }

        const tocButtonContainerHTML = `
        <div class="stoc-toc-container">
            <div id="stoc-toc-button-wrapper" class="collapsed">
                <div id="stoc-toc-button-header" role="button" tabindex="0" aria-expanded="false" aria-controls="stoc-toc-button-scrollbox">
                    <h3 id="stoc-toc-button-header-title">
                        <i class="fas fa-book-open" aria-hidden="true"></i>
                        <span class="stoc-toc-button-title-text">सार संग्रह</span>
                        <i class="fas fa-hand-point-right stoc-toc-open-prompt-icon" aria-hidden="true"></i>
                    </h3>
                    <i id="stoc-toc-button-toggle-icon" class="fas fa-chevron-down" aria-hidden="true"></i>
                </div>
                <div id="stoc-toc-button-scrollbox" role="region" aria-labelledby="stoc-toc-button-header-title">
                    <ul id="stoc-toc-button-list">
                        <!-- जावास्क्रिप्ट TOC आइटम्स यहाँ डालेगा -->
                    </ul>
                    <div id="stoc-button-scroll-indicator" class="stoc-toc-scroll-indicator">
                         <i class="fas fa-angles-down" aria-hidden="true"></i>
                    </div>
                </div>
            </div>
        </div>`;

        const postContentAreaForButtonPlacement = document.querySelector('.post-body.entry-content') || // सामान्य ब्लॉगर
                                                  document.querySelector('.post-body') || // फॉलबैक यदि entry-content नहीं है
                                                  document.querySelector('.cnl-main-content'); // आपके पिछले उदाहरणों से

        if (postContentAreaForButtonPlacement && !document.getElementById('stoc-toc-button-wrapper')) {
            const firstH2 = postContentAreaForButtonPlacement.querySelector('h2');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = tocButtonContainerHTML.trim();
            const tocNodeToInsert = tempDiv.firstChild;

            if (firstH2) {
                firstH2.parentNode.insertBefore(tocNodeToInsert, firstH2);
                return true;
            } else {
                // यदि कोई H2 नहीं है, तो इसे कंटेंट की शुरुआत में डालें,
                // बाद में hasHeadings लॉजिक इसे छिपा सकता है यदि कोई हेडिंग नहीं मिलती है।
                postContentAreaForButtonPlacement.insertBefore(tocNodeToInsert, postContentAreaForButtonPlacement.firstChild);
                console.warn("Stylish TOC: इन-कंटेंट बटन के लिए कोई H2 हेडिंग नहीं मिली, कंटेंट की शुरुआत में डाला गया।");
                return true; // फिर भी डाला गया
            }
        } else if (document.getElementById('stoc-toc-button-wrapper')) {
            return true; // पहले से मौजूद है
        }
        console.warn("Stylish TOC: इन-कंटेंट बटन के लिए पोस्ट कंटेंट एरिया नहीं मिला।");
        return false;
    }

    // --- DOMContentLoaded के शुरुआत में इन-कंटेंट बटन को स्थापित करें ---
    const inContentButtonPlacedOrExists = createAndPlaceInContentTocButton();

    // --- एलिमेंट चयन (stoc- प्रीफिक्स के साथ) ---
    // इन-कंटेंट बटन के एलिमेंट्स (अब DOM में होने चाहिए)
    const tocButtonWrapper = document.getElementById('stoc-toc-button-wrapper');
    const tocButtonHeader = document.getElementById('stoc-toc-button-header');
    const tocButtonScrollbox = document.getElementById('stoc-toc-button-scrollbox');
    const tocButtonList = document.getElementById('stoc-toc-button-list');
    const buttonScrollIndicator = document.getElementById('stoc-button-scroll-indicator');

    // फ्लोटिंग और साइडबार एलिमेंट्स (ये थीम HTML से सीधे आते हैं)
    const floatingTocIcon = document.getElementById('stoc-floating-toc-icon');
    const tocSidebar = document.getElementById('stoc-toc-icon-sidebar');
    const tocSidebarInternalClose = document.getElementById('stoc-toc-sidebar-internal-close');
    const tocSidebarExternalClose = document.getElementById('stoc-toc-sidebar-external-close');
    const tocSidebarList = document.getElementById('stoc-toc-icon-sidebar-list');
    const tocSidebarScrollbox = document.getElementById('stoc-toc-icon-sidebar-scrollbox');
    const sidebarScrollIndicator = document.getElementById('stoc-sidebar-scroll-indicator');

    // --- ब्लॉगर पोस्ट कंटेंट एरिया का चयन (मुख्य प्रोसेसिंग के लिए) ---
    const postContentArea = document.querySelector('.post-body.entry-content') ||
                            document.querySelector('.post-body') ||
                            document.querySelector('.cnl-main-content');

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
    const scrollOffset = 70; // आपके हेडर की ऊँचाई के अनुसार समायोजित करें
    const highlightDurationFallback = 2800; // CSS var '--stoc-popup-highlight-duration' से मेल खाना चाहिए (2.8s = 2800ms)
    const clickEffectDuration = 400;

    // --- प्रारंभिक जांच ---
    // यदि मुख्य कंटेंट एरिया नहीं मिला, तो कुछ भी न करें
    if (!postContentArea) {
        console.warn("Stylish TOC Error: मुख्य पोस्ट कंटेंट एरिया नहीं मिला। TOC अक्षम किया जा रहा है।");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        return;
    }
    // फ्लोटिंग/साइडबार के लिए आवश्यक तत्वों की जांच
    if (!tocSidebarList || !floatingTocIcon || !tocSidebar) {
        console.warn("Stylish TOC Error: आवश्यक फ्लोटिंग/साइडबार TOC तत्व नहीं मिले। फ्लोटिंग TOC अक्षम।");
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
    }
    // इन-कंटेंट बटन के लिए आवश्यक तत्वों की जांच (यदि यह स्थापित किया गया था या पहले से मौजूद था)
    if (inContentButtonPlacedOrExists && (!tocButtonWrapper || !tocButtonList)) {
        console.warn("Stylish TOC Error: इन-कंटेंट बटन के आवश्यक तत्व नहीं मिले। इन-कंटेंट TOC अक्षम।");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
    }


    // --- हेडिंग्स से TOC बनाएं ---
    const headings = postContentArea.querySelectorAll('h2, h3:not(#stoc-toc-button-header-title):not(#stoc-toc-sidebar-title), h4, h5, h6');
    const fragmentButton = document.createDocumentFragment(); // इन-कंटेंट बटन लिस्ट के लिए
    const fragmentSidebar = document.createDocumentFragment(); // साइडबार लिस्ट के लिए

    headings.forEach((heading) => {
        if (!heading.textContent?.trim()) return;
        if (heading.closest('#stoc-toc-button-wrapper')) return;
        if (heading.closest('#stoc-toc-icon-sidebar')) return;

        hasHeadings = true;
        let id = heading.id;
        if (!id) {
            id = 'stoc_' + (heading.textContent || 'heading').trim().toLowerCase()
                   .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
            let counter = 1;
            let originalId = id;
            while (document.getElementById(id)) {
                id = `${originalId}-${counter++}`;
            }
            heading.id = id;
        }

        const level = parseInt(heading.tagName.substring(1));
        const linkText = heading.textContent.trim();
        const iconClass = headingIcons[level] || 'fas fa-circle';

        if (tocButtonList) {
            const listItemButton = document.createElement('li');
            listItemButton.className = `stoc-toc-list-item level-${level}`;
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.dataset.targetId = id;
            const iconSpan = document.createElement('span');
            iconSpan.className = 'stoc-toc-item-icon';
            iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
            const textSpan = document.createElement('span');
            textSpan.className = 'stoc-toc-item-text';
            textSpan.textContent = linkText;
            link.appendChild(iconSpan);
            link.appendChild(textSpan);
            listItemButton.appendChild(link);
            fragmentButton.appendChild(listItemButton);
        }

        if (tocSidebarList) {
            const listItemSidebar = document.createElement('li');
            listItemSidebar.className = `stoc-toc-list-item level-${level}`;
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.dataset.targetId = id;
            const iconSpan = document.createElement('span');
            iconSpan.className = 'stoc-toc-item-icon';
            iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
            const textSpan = document.createElement('span');
            textSpan.className = 'stoc-toc-item-text';
            textSpan.textContent = linkText;
            link.appendChild(iconSpan);
            link.appendChild(textSpan);
            listItemSidebar.appendChild(link);
            fragmentSidebar.appendChild(listItemSidebar);
        }
    });

    if (tocButtonList) tocButtonList.appendChild(fragmentButton);
    if (tocSidebarList) tocSidebarList.appendChild(fragmentSidebar);

    if (!hasHeadings) {
        console.warn("Stylish TOC: पोस्ट में कोई H2-H6 हेडिंग नहीं मिली। सभी TOC छिपाए जा रहे हैं।");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
    } else {
        if (tocButtonWrapper && tocButtonScrollbox && buttonScrollIndicator) {
            checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
            if (floatingTocIcon) setupTocButtonObserver();
            if (tocButtonHeader) setInitialButtonTocState();
        }
        if (tocSidebar && tocSidebarScrollbox && sidebarScrollIndicator) {
            checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
        }
        if (floatingTocIcon && tocButtonWrapper) {
             const tocButtonRect = tocButtonWrapper.getBoundingClientRect();
             if (tocButtonRect.bottom < 0 || tocButtonRect.top > window.innerHeight) {
                 if (!tocSidebar || !tocSidebar.classList.contains('visible')) {
                     floatingTocIcon.classList.add('visible');
                 }
             }
        } else if (floatingTocIcon && !tocButtonWrapper && hasHeadings) {
            floatingTocIcon.classList.add('visible');
        }
    }

    // --- बटन TOC कार्यक्षमता ---
    function toggleButtonToc() {
        if (!tocButtonWrapper || !tocButtonHeader) return;
        const isCollapsed = tocButtonWrapper.classList.toggle('collapsed');
        tocButtonWrapper.classList.toggle('expanded', !isCollapsed);
        tocButtonHeader.setAttribute('aria-expanded', String(!isCollapsed));
        if (!isCollapsed) {
            if(tocButtonScrollbox && buttonScrollIndicator) setTimeout(() => checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator), 50);
            if(tocButtonScrollbox) tocButtonScrollbox.focus();
        } else {
            tocButtonHeader.focus();
        }
    }

    function setInitialButtonTocState() {
        if (!tocButtonWrapper || !tocButtonHeader) return;
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
        if (!tocButtonWrapper || !floatingTocIcon) return;

        if (!('IntersectionObserver' in window)) {
            console.warn("IntersectionObserver समर्थित नहीं है।");
            if (hasHeadings) {
                const checkVisibility = () => {
                    if (!tocButtonWrapper) return;
                    const rect = tocButtonWrapper.getBoundingClientRect();
                    if ((rect.bottom < 0 || rect.top > window.innerHeight) && (!tocSidebar || !tocSidebar.classList.contains('visible'))) {
                        floatingTocIcon.classList.add('visible');
                    } else {
                        floatingTocIcon.classList.remove('visible');
                    }
                };
                checkVisibility();
                window.addEventListener('scroll', checkVisibility, { passive: true });
                window.addEventListener('resize', checkVisibility, { passive: true });
            }
            return;
        }

        const observerOptions = { root: null, rootMargin: '0px', threshold: 0 };
        tocButtonObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && (!tocSidebar || !tocSidebar.classList.contains('visible'))) {
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
        if (!tocSidebar || !tocSidebarExternalClose || !floatingTocIcon) return;
        tocSidebar.classList.add('visible');
        tocSidebar.setAttribute('aria-hidden', 'false');
        document.body.classList.add('stoc-toc-sidebar-open');
        tocSidebarExternalClose.classList.add('visible');
        floatingTocIcon.classList.remove('visible');

        if (tocSidebarScrollbox && sidebarScrollIndicator) checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
        setTimeout(() => tocSidebarInternalClose?.focus(), 50);
        setTimeout(() => { document.addEventListener('click', handleOutsideSidebarClick, true); }, 100);
    }

    function closeSidebar() {
        if (!tocSidebar || !tocSidebarExternalClose || !floatingTocIcon) return;
        tocSidebar.classList.remove('visible');
        tocSidebar.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('stoc-toc-sidebar-open');
        tocSidebarExternalClose.classList.remove('visible');

        if (tocButtonWrapper) {
            const buttonRect = tocButtonWrapper.getBoundingClientRect();
            if (buttonRect.bottom < 0 || buttonRect.top > window.innerHeight) {
                floatingTocIcon.classList.add('visible');
            }
        } else if (hasHeadings) {
            floatingTocIcon.classList.add('visible');
        }

        document.removeEventListener('click', handleOutsideSidebarClick, true);

        if(floatingTocIcon && document.activeElement === tocSidebarInternalClose) floatingTocIcon.focus();
        else if (tocSidebarExternalClose && document.activeElement === tocSidebarExternalClose) floatingTocIcon?.focus();
    }

    function handleOutsideSidebarClick(event) {
        if (!tocSidebar || !floatingTocIcon || !tocSidebarExternalClose) return;
        if (tocSidebar.classList.contains('visible') &&
            !tocSidebar.contains(event.target) &&
            event.target !== floatingTocIcon && !floatingTocIcon.contains(event.target) &&
            event.target !== tocSidebarExternalClose && !tocSidebarExternalClose.contains(event.target)) {
           closeSidebar();
        }
    }

    if (floatingTocIcon) floatingTocIcon.addEventListener('click', (e) => { e.stopPropagation(); openSidebar(); });
    if (tocSidebarInternalClose) tocSidebarInternalClose.addEventListener('click', closeSidebar);
    if (tocSidebarExternalClose) tocSidebarExternalClose.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && tocSidebar && tocSidebar.classList.contains('visible')) closeSidebar();
    });

    // --- TOC लिंक क्लिक हैंडलिंग ---
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
                if (tocSidebar && tocSidebar.classList.contains('visible')) {
                    closeSidebar();
                    // साइडबार बंद होने के ट्रांजिशन के बाद स्क्रॉल करें
                    setTimeout(() => { scrollToElement(targetElement); }, 300); // थोड़ा विलंब
                } else {
                    scrollToElement(targetElement);
                }
            } else {
                console.warn(`Stylish TOC: लक्ष्य तत्व आईडी के साथ नहीं मिला: ${targetId}`);
            }
        }
    }
    if (tocButtonList) tocButtonList.addEventListener('click', handleTocLinkClick);
    if (tocSidebarList) tocSidebarList.addEventListener('click', handleTocLinkClick);


    // --- scrollToElement, applyHighlight, clearHighlight --- (सुधारित संस्करण)
    function scrollToElement(element) {
         const elementRect = element.getBoundingClientRect();
         const absoluteElementTop = elementRect.top + window.pageYOffset; // pageYOffset is alias for scrollY
         const offsetPosition = absoluteElementTop - scrollOffset;
         window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
         // स्क्रॉल पूरा होने के बाद हाइलाइट लागू करें
         // स्मूथ स्क्रॉल का समय ब्राउज़र द्वारा निर्धारित होता है, इसलिए थोड़ा बड़ा विलंब सुरक्षित है
         setTimeout(() => { applyHighlight(element); }, 700); // स्क्रॉल एनीमेशन के बाद
    }

    function applyHighlight(headingElement) {
        clearHighlight(); // पहले सभी मौजूदा हाइलाइट्स को साफ करें

        // हेडिंग को हाइलाइट करें
        headingElement.classList.add('stoc-toc-target-heading', 'stoc-highlight-active');
        currentlyHighlightedElements.push(headingElement);

        let nextElem = headingElement.nextElementSibling;
        const headingLevel = parseInt(headingElement.tagName.substring(1));

        while (nextElem) {
            const tagName = nextElem.tagName.toUpperCase();
            if (tagName.startsWith('H')) {
                const nextLevel = parseInt(tagName.substring(1));
                if (nextLevel <= headingLevel) break; // अगली समान या उच्च स्तर की हेडिंग पर रुकें
            }
            // पैराग्राफ और अन्य संबंधित तत्वों को हाइलाइट करें
            if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE', 'PRE', 'TABLE'].includes(tagName)) {
                nextElem.classList.add('stoc-toc-target-paragraph', 'stoc-highlight-active');
                currentlyHighlightedElements.push(nextElem);
            }
            nextElem = nextElem.nextElementSibling;
        }

        // हाइलाइट की अवधि के लिए टाइमआउट सेट करें
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
            } catch (e) { console.warn("Stylish TOC: CSS var --stoc-popup-highlight-duration parse error", e); }
        }
        
        // सुनिश्चित करें कि highlightDurationMs एक वैध संख्या है
        if (isNaN(highlightDurationMs) || highlightDurationMs <= 500) {
             highlightDurationMs = highlightDurationFallback; // फॉलबैक पर वापस जाएं यदि पार्सिंग विफल हो जाती है
        }


        highlightTimeout = setTimeout(() => {
            currentlyHighlightedElements.forEach(el => {
                el.classList.add('fading-out'); // फेड-आउट एनिमेशन के लिए क्लास
                setTimeout(() => {
                    // फेड-आउट के बाद सभी हाइलाइटिंग क्लास हटाएं
                    el.classList.remove('stoc-toc-target-heading', 'stoc-toc-target-paragraph', 'stoc-highlight-active', 'fading-out');
                }, 500); // यह अवधि CSS में 'fading-out' ट्रांजिशन (0.4s = 400ms) से थोड़ी अधिक होनी चाहिए
            });
            currentlyHighlightedElements = []; // हाइलाइट किए गए तत्वों की सूची खाली करें
        }, highlightDurationMs - 500); // फेड-आउट शुरू करने का समय (मुख्य हाइलाइट अवधि से 500ms पहले)
    }

    function clearHighlight() {
        if (highlightTimeout) clearTimeout(highlightTimeout);
        highlightTimeout = null;
        currentlyHighlightedElements.forEach(el => {
            // सभी हाइलाइटिंग क्लास हटाएं
            el.classList.remove('stoc-toc-target-heading', 'stoc-toc-target-paragraph', 'stoc-highlight-active', 'fading-out');
        });
        currentlyHighlightedElements = [];
    }


    // --- स्क्रॉल इंडिकेटर दृश्यता ---
    function checkScrollIndicatorVisibility(scrollbox, indicator) {
        if (!scrollbox || !indicator) return;
        let isVisibleState = indicator.classList.contains('visible'); // वर्तमान स्थिति को ट्रैक करने के लिए स्थानीय चर

        function check() {
            if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) {
                if (isVisibleState) { indicator.classList.remove('visible'); isVisibleState = false; }
                return;
            }
            const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 5;
            const isAtBottom = scrollbox.scrollTop + scrollbox.clientHeight >= scrollbox.scrollHeight - 5;
            const shouldBeVisible = isScrollable && !isAtBottom;

            if (shouldBeVisible && !isVisibleState) { indicator.classList.add('visible'); isVisibleState = true; }
            else if (!shouldBeVisible && isVisibleState) { indicator.classList.remove('visible'); isVisibleState = false; }
        }
        // DOM अपडेट और रेंडरिंग के लिए थोड़ा विलंब दें
        setTimeout(check, 300);

        scrollbox.addEventListener('scroll', check, { passive: true });

        // ईवेंट लिस्नर जो TOC विस्तार/संकोचन या साइडबार खोलने पर जांच करते हैं
        if (scrollbox === tocButtonScrollbox && tocButtonHeader) {
             // 'click' के बजाय, हम टॉगल फ़ंक्शन के प्रभाव के बाद जांचते हैं
            const originalToggleButtonToc = toggleButtonToc; // मूल फंक्शन को स्टोर करें
            toggleButtonToc = function() { // इसे रैप करें
                originalToggleButtonToc.apply(this, arguments); // मूल को कॉल करें
                setTimeout(check, 550); // टॉगल एनिमेशन के बाद जांच करें (CSS ट्रांजिशन अवधि के अनुसार समायोजित करें)
            };
            // यदि हेडर पर सीधे इवेंट लिस्नर जोड़ा गया है, तो उसे नए रैप किए गए फंक्शन से अपडेट करें
            // या सुनिश्चित करें कि toggleButtonToc जहां भी कॉल होता है, वह रैप्ड वर्जन हो।
            // इस मामले में, चूंकि toggleButtonToc एक ही जगह परिभाषित है, तो यह ठीक होना चाहिए
            // लेकिन अगर इसे कई जगहों से कॉल किया जाता है, तो रैपिंग को परिभाषित करने के स्थान पर करना होगा।
            // सरल तरीका: क्लिक लिस्नर को भी यहां अपडेट करें यदि आवश्यक हो।
            // चूंकि toggleButtonToc सीधे इवेंट लिस्नर से कॉल होता है, तो यह काम करेगा।
        }
        if (scrollbox === tocSidebarScrollbox && floatingTocIcon) {
            // साइडबार के लिए भी ऐसा ही करें
            const originalOpenSidebar = openSidebar;
            openSidebar = function() {
                originalOpenSidebar.apply(this, arguments);
                setTimeout(check, 550); // साइडबार एनिमेशन के बाद
            };
        }
        window.addEventListener('resize', check, { passive: true });
    }
});
