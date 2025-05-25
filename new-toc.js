/* ==========================================================================
   Stylish TOC JavaScript for Blogger (v1.2 - अब इन-कंटेंट बटन को डायनामिक रूप से स्थापित करता है)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- इन-कंटेंट बटन को डायनामिक रूप से स्थापित करने का फंक्शन ---
    function createAndPlaceInContentTocButton() {
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

        // --- ब्लॉगर पोस्ट कंटेंट एरिया का चयन (यह सेलेक्टर महत्वपूर्ण है) ---
        const postContentAreaForButtonPlacement = document.querySelector('.post-body.entry-content') || // सामान्य ब्लॉगर क्लास
                                                  document.querySelector('.cnl-main-content') ||  // आपके उदाहरण आर्टिकल से
                                                  document.querySelector('.post-body'); // फॉलबैक

        if (postContentAreaForButtonPlacement && !document.getElementById('stoc-toc-button-wrapper')) {
            const firstH2 = postContentAreaForButtonPlacement.querySelector('h2');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = tocButtonContainerHTML.trim();
            const tocNodeToInsert = tempDiv.firstChild; // .stoc-toc-container

            if (firstH2) {
                firstH2.parentNode.insertBefore(tocNodeToInsert, firstH2);
                return true;
            } else {
                // यदि कोई H2 नहीं है, तो या तो इसे कंटेंट की शुरुआत में डालें
                // postContentAreaForButtonPlacement.insertBefore(tocNodeToInsert, postContentAreaForButtonPlacement.firstChild);
                // या यदि कोई H2 नहीं है तो इन-कंटेंट बटन न दिखाएं।
                // मौजूदा 'hasHeadings' लॉजिक इसे बाद में छिपा सकता है यदि कोई हेडिंग न मिले।
                // अभी के लिए, हम इसे नहीं डालेंगे यदि H2 नहीं मिलता है।
                console.warn("Stylish TOC: इन-कंटेंट बटन के लिए कोई H2 हेडिंग नहीं मिली।");
                return false;
            }
        } else if (document.getElementById('stoc-toc-button-wrapper')) {
            return true; // पहले से मौजूद है (शायद थीम द्वारा डाला गया, हालांकि हमने हटाने को कहा है)
        }
        return false; // कंटेंट एरिया नहीं मिला
    }

    // --- DOMContentLoaded के शुरुआत में इन-कंटेंट बटन को स्थापित करें ---
    const inContentButtonPlaced = createAndPlaceInContentTocButton();

    // --- अब आपके मौजूदा JS का बाकी हिस्सा ---
    // --- एलिमेंट चयन (stoc- प्रीफिक्स के साथ) ---
    // ये अब DOM में मौजूद होने चाहिए यदि inContentButtonPlaced === true
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
                            document.querySelector('.cnl-main-content') ||
                            document.querySelector('.post-body');


    // --- राज्य चर --- (आपके मौजूदा कोड से)
    let currentlyHighlightedElements = [];
    let highlightTimeout = null;
    let tocButtonObserver = null; // यह केवल तभी बनेगा जब tocButtonWrapper मौजूद हो
    let hasHeadings = false;

    // --- कॉन्फ़िगरेशन --- (आपके मौजूदा कोड से)
    const headingIcons = { /* ... */ };
    const scrollOffset = 70;
    const highlightDurationFallback = 4000; // आपके CSS से `--stoc-popup-highlight-duration`
    const clickEffectDuration = 400;

    // --- प्रारंभिक जांच में थोड़ा बदलाव ---
    // अब tocButtonWrapper और tocButtonList की जांच केवल तभी करें जब inContentButtonPlaced सत्य हो या वे पहले से मौजूद हों।
    // फ्लोटिंग/साइडबार की जांच हमेशा करें।
    if ( !tocSidebarList || !postContentArea || !floatingTocIcon || !tocSidebar ) {
        console.warn("Stylish TOC Error: आवश्यक फ्लोटिंग/साइडबार TOC तत्व या पोस्ट कंटेंट एरिया नहीं मिला।");
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        // यदि इन-कंटेंट बटन स्थापित नहीं हुआ और यह रैपर भी नहीं मिला तो कुछ नहीं करें
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        return;
    }
    // यदि इन-कंटेंट बटन के लिए रैपर या लिस्ट नहीं मिली, तो केवल उस हिस्से को अक्षम करें
    if (inContentButtonPlaced && (!tocButtonWrapper || !tocButtonList)) {
         console.warn("Stylish TOC Error: इन-कंटेंट बटन स्थापित करने के बाद भी उसके तत्व नहीं मिले।");
         if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
         // फ्लोटिंग TOC अभी भी काम कर सकता है, इसलिए return न करें।
    }


    // --- हेडिंग्स से TOC बनाएं ---
    // सुनिश्चित करें कि postContentArea मौजूद है
    if (!postContentArea) {
        console.warn("Stylish TOC: हेडिंग्स प्रोसेस करने के लिए पोस्ट कंटेंट एरिया नहीं मिला।");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        return;
    }

    const headings = postContentArea.querySelectorAll('h2, h3:not(#stoc-toc-button-header-title):not(#stoc-toc-sidebar-title), h4, h5, h6');
    const fragmentButton = document.createDocumentFragment();
    const fragmentSidebar = document.createDocumentFragment();

    headings.forEach((heading) => {
        // Skip empty headings
        if (!heading.textContent?.trim()) {
            return;
        }
        // Skip headings within the TOC button itself
        if (heading.closest('#stoc-toc-button-wrapper')) {
             return;
        }
        // Skip headings within the Sidebar TOC
        if (heading.closest('#stoc-toc-icon-sidebar')) {
            return;
        }

        hasHeadings = true;
        // ... (आपका मौजूदा ID जनरेशन और लिस्ट आइटम क्रिएशन लॉजिक) ...
        let id = heading.id;
        if (!id) { /* ... id बनाएं ... */
            id = 'stoc_' + (heading.textContent || 'heading').trim().toLowerCase()
               .replace(/[^\w\s-]/g, '')
               .replace(/\s+/g, '-')
               .replace(/-+/g, '-');
            let counter = 1;
            let originalId = id;
            while (document.getElementById(id)) {
                id = `${originalId}-${counter}`;
                counter++;
            }
            heading.id = id;
        }
        const level = parseInt(heading.tagName.substring(1));
        const linkText = heading.textContent.trim();
        const iconClass = headingIcons[level] || 'fas fa-circle';

        [fragmentButton, fragmentSidebar].forEach(fragment => {
            const listItem = document.createElement('li');
            listItem.className = `stoc-toc-list-item level-${level}`;
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
            listItem.appendChild(link);
            fragment.appendChild(listItem);
        });
    });

    // Append generated TOCs to the respective lists
    // केवल तभी अपेंड करें जब लिस्ट मौजूद हो
    if (tocButtonList) tocButtonList.appendChild(fragmentButton);
    if (tocSidebarList) tocSidebarList.appendChild(fragmentSidebar);


    // Hide TOCs if no valid headings were found
    if (!hasHeadings) {
        console.warn("Stylish TOC: पोस्ट में कोई H2-H6 हेडिंग नहीं मिली। TOC छिपाया जा रहा है।");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
    } else {
        // Initialize visibility checks and observers only if headings exist AND elements are present
        if (tocButtonWrapper && tocButtonScrollbox && buttonScrollIndicator) {
            checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
            setupTocButtonObserver(); // यह tocButtonWrapper पर निर्भर करता है
            setInitialButtonTocState(); // यह tocButtonWrapper और tocButtonHeader पर निर्भर करता है
        }
        if (tocSidebarScrollbox && sidebarScrollIndicator) {
            checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
        }
    }

    // --- बटन TOC कार्यक्षमता ---
    function toggleButtonToc() {
        if (!tocButtonWrapper || !tocButtonHeader) return; // सुरक्षा जांच
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
        if (!tocButtonWrapper || !tocButtonHeader) return; // सुरक्षा जांच
        tocButtonWrapper.classList.add('collapsed');
        tocButtonWrapper.classList.remove('expanded');
        tocButtonHeader.setAttribute('aria-expanded', 'false');
        if(buttonScrollIndicator) buttonScrollIndicator.classList.remove('visible');
    }

    if (tocButtonHeader) {
        tocButtonHeader.addEventListener('click', toggleButtonToc);
        tocButtonHeader.addEventListener('keydown', (event) => { /* ... */ });
    } else if (inContentButtonPlaced) {
        // यदि बटन स्थापित किया गया था लेकिन हेडर नहीं मिला, तो यह एक समस्या है
        console.warn("Stylish TOC: tocButtonHeader इन-कंटेंट बटन स्थापित करने के बाद भी नहीं मिला।");
    }

    // --- फ्लोटिंग आइकन दृश्यता (Intersection Observer) ---
    function setupTocButtonObserver() {
        if (!tocButtonWrapper || !floatingTocIcon) return; // सुनिश्चित करें कि दोनों तत्व मौजूद हैं
        if (!('IntersectionObserver' in window)) {
            // ... (आपका मौजूदा फॉलबैक लॉजिक) ...
            if(floatingTocIcon && hasHeadings) floatingTocIcon.classList.add('visible');
            return;
        }
        const observerOptions = { /* ... */ };
        tocButtonObserver = new IntersectionObserver((entries) => { /* ... */ }, observerOptions);
        tocButtonObserver.observe(tocButtonWrapper);
    }

    // --- साइडबार TOC कार्यक्षमता --- (आपके मौजूदा कोड से)
    // function openSidebar() { ... }
    // function closeSidebar() { ... }
    // ... (बाकी साइडबार लॉजिक)

    // --- TOC लिंक क्लिक हैंडलिंग और हाइलाइटिंग --- (आपके मौजूदा कोड से)
    // function handleTocLinkClick(event) { ... }
    // function scrollToElement(element) { ... }
    // if (tocButtonList) tocButtonList.addEventListener('click', handleTocLinkClick);
    // if (tocSidebarList) tocSidebarList.addEventListener('click', handleTocLinkClick);

    // --- हेडिंग और पैराग्राफ हाइलाइटिंग --- (आपके मौजूदा कोड से)
    // function applyHighlight(headingElement) { ... }
    // function clearHighlight() { ... }

    // --- स्क्रॉल इंडिकेटर दृश्यता --- (आपके मौजूदा कोड से)
    // function checkScrollIndicatorVisibility(scrollbox, indicator) { ... }

    // बाकी का आपका JS कोड यहाँ ...
    // (मैंने केवल शुरुआती सेटअप और कुछ सुरक्षा जांचें जोड़ी हैं)
    // आपको अपने मौजूदा openSidebar, closeSidebar, handleTocLinkClick, scrollToElement,
    // applyHighlight, clearHighlight, और checkScrollIndicatorVisibility फ़ंक्शंस को
    // यहाँ रखना होगा, जैसा वे पहले थे, बस यह सुनिश्चित करते हुए कि वे केवल तभी कॉल हों
    // जब संबंधित DOM एलिमेंट्स मौजूद हों।

    // यह सुनिश्चित करने के लिए कि event listeners सही ढंग से जोड़े गए हैं:
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
        if (event.key === 'Escape' && tocSidebar && tocSidebar.classList.contains('visible')) {
            closeSidebar();
        }
    });

    if (tocButtonList) { // Event listener केवल तभी जोड़ें जब tocButtonList मौजूद हो
        tocButtonList.addEventListener('click', handleTocLinkClick);
    }
    if (tocSidebarList) { // Event listener केवल तभी जोड़ें जब tocSidebarList मौजूद हो
        tocSidebarList.addEventListener('click', handleTocLinkClick);
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

        setTimeout(() => {
            document.addEventListener('click', handleOutsideSidebarClick, true);
        }, 100);
    }

    function closeSidebar() {
        if (!tocSidebar || !tocSidebarExternalClose || !floatingTocIcon || !tocButtonWrapper) return;
        tocSidebar.classList.remove('visible');
        tocSidebar.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('stoc-toc-sidebar-open');
        tocSidebarExternalClose.classList.remove('visible');

        const buttonRect = tocButtonWrapper.getBoundingClientRect();
        if (buttonRect.bottom < 0 || buttonRect.top > window.innerHeight) {
            floatingTocIcon.classList.add('visible');
        }

        document.removeEventListener('click', handleOutsideSidebarClick, true);

        if(floatingTocIcon && document.activeElement === tocSidebarInternalClose) {
            floatingTocIcon.focus();
        } else if (tocSidebarExternalClose && document.activeElement === tocSidebarExternalClose){
            floatingTocIcon?.focus();
        }
    }

    function handleOutsideSidebarClick(event) {
        if (!tocSidebar || !floatingTocIcon || !tocSidebarExternalClose) return;
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
                if (tocSidebar && tocSidebar.classList.contains('visible')) {
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
        }, 700); // स्मूथ स्क्रॉल के बाद हाइलाइट
    }

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
        if (cssDuration) { /* ... आपका मौजूदा ड्यूरेशन पार्सिंग लॉजिक ... */
             try {
                 const durationValue = parseFloat(cssDuration);
                 if (cssDuration.toLowerCase().includes('ms')) {
                     highlightDurationMs = durationValue;
                 } else if (cssDuration.toLowerCase().includes('s')) {
                     highlightDurationMs = durationValue * 1000;
                 }
             } catch (e) { /* ... */ }
        }

        highlightTimeout = setTimeout(() => {
            currentlyHighlightedElements.forEach(el => {
                el.classList.add('fading-out');
                setTimeout(() => {
                    el.classList.remove('stoc-toc-target-heading', 'stoc-toc-target-paragraph', 'fading-out');
                }, 500); // CSS में फेड-आउट एनिमेशन ड्यूरेशन से मैच करें
            });
            currentlyHighlightedElements = [];
        }, highlightDurationMs - 500); // फेड-आउट शुरू करने के लिए
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
            // यदि बटन TOC कोलैप्स्ड है, तो उसके इंडिकेटर को न दिखाएं
            if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) {
                if (isVisible) { indicator.classList.remove('visible'); isVisible = false; }
                return;
            }

            const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 5; // थोड़ा बफर
            const isNearBottom = scrollbox.scrollTop + scrollbox.clientHeight >= scrollbox.scrollHeight - 20; // थोड़ा बफर
            // इंडिकेटर को तब दिखाएं जब स्क्रॉल करने योग्य हो और नीचे न पहुंचा हो
            const shouldBeVisible = isScrollable && !isNearBottom;

            if (shouldBeVisible && !isVisible) { indicator.classList.add('visible'); isVisible = true; }
            else if (!shouldBeVisible && isVisible) { indicator.classList.remove('visible'); isVisible = false; }
        }
        // DOM अपडेट और लेआउट के बाद जांचें
        setTimeout(check, 250);
        scrollbox.addEventListener('scroll', check, { passive: true });

        // बटन या आइकन क्लिक पर फिर से जांचें क्योंकि कंटेंट का आकार बदल सकता है या स्क्रॉलबॉक्स दृश्यमान हो सकता है
        if (scrollbox === tocButtonScrollbox && tocButtonHeader) {
            tocButtonHeader.addEventListener('click', () => { setTimeout(check, 600); }); // ट्रांजिशन के बाद
        }
        if (scrollbox === tocSidebarScrollbox && floatingTocIcon) {
            floatingTocIcon.addEventListener('click', () => { setTimeout(check, 550); }); // ट्रांजिशन के बाद
        }
         window.addEventListener('resize', check, { passive: true });
    }


}); // DOMContentLoaded का अंत
