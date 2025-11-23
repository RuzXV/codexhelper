<script>
    import { onMount } from 'svelte';
    
    export let currentPath = "/";

    import logo from '../assets/images/global/logo-new.webp';
    import homeIcon from '../assets/images/navi/navi_home.webp';
    import faqIcon from '../assets/images/navi/navi_question.webp';
    import toolsIcon from '../assets/images/navi/navi_tools.webp';
    import patreonLogo from '../assets/images/navi/patreon.webp';
    import subscribedIcon from '../assets/images/navi/subscribed.webp';

    $: isToolsPage = currentPath.startsWith('/tools');

    let isPatron = false;

    onMount(() => {
        if (window.auth && window.auth.getLoggedInUser()) {
             const user = window.auth.getLoggedInUser();
             if (user && user.is_active_patron) isPatron = true;
        }

        const handleAuth = (event) => {
            const user = event.detail.user;
            if (user && user.is_active_patron) {
                isPatron = true;
            } else {
                isPatron = false;
            }
        };

        document.addEventListener('auth:loggedIn', handleAuth);
        return () => {
            document.removeEventListener('auth:loggedIn', handleAuth);
        };
    });
</script>

<nav class="navbar">
    <div class="nav-container">
        <div class="nav-brand">
            <a href="/" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: var(--spacing-2);">
                <img src={logo.src} alt="Codex Helper Logo" class="logo-image" width="120" height="120" loading="eager"/>
                <span>Codex Helper</span>
            </a>
        </div>
        <div class="nav-links">
            <a href="/" class="nav-link" class:active={currentPath === "/"}>
                <img src={homeIcon.src} alt="Home" class="nav-icon" width="60" height="60" loading="eager"/>
                <span>Home</span>
            </a>
            <a href="/faq" class="nav-link" class:active={currentPath.startsWith('/faq')}>
                <img src={faqIcon.src} alt="FAQ" class="nav-icon" width="60" height="60" loading="eager"/>
                <span>FAQ</span>
            </a>
            <a href="/tools" class="nav-link" class:active={isToolsPage}>
                <img src={toolsIcon.src} alt="Tools" class="nav-icon" width="60" height="60" loading="eager"/>
                <span>Tools</span>
            </a>

            <div id="auth-container" style={!isToolsPage ? 'display: none;' : ''}></div>
            
            {#if !isToolsPage}
                {#if isPatron}
                    <span class="subscribed-btn">
                        <img src={subscribedIcon.src} alt="Subscribed" class="subscribed-icon" width="90" height="90" />
                        <span>Subscribed!</span>
                    </span>
                {:else}
                    <a href="https://www.patreon.com/c/kingscodex" target="_blank" class="patreon-btn">
                        <img src={patreonLogo.src} alt="Patreon Logo" class="patreon-logo" width="90" height="90" loading="eager"/>
                        <span>Subscribe</span>
                    </a>
                {/if}
            {/if}
        </div>
    </div>
    
    {#if isToolsPage}
        <div class="sub-navbar" style="opacity: 1; transform: translateY(0);">
            <div class="sub-nav-container">
                <a href="/tools/mail/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/mail')}>Alliance Mail Generator</a>
                <a href="/tools/calculators/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/calculators')}>General Calculators</a>
                <a href="/tools/equipment/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/equipment')}>Equipment Calculators</a>
                <a href="/tools/davor_toolkit/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/davor_toolkit')}>Davor's Toolkit</a>
                <a href="/tools/calendar/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/calendar')}>Event Calendar</a>
            </div>
        </div>
    {/if}
</nav>

<style>
    .subscribed-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-2);
        padding: var(--spacing-1) var(--spacing-3);
        border-radius: var(--radius-md);
        font-weight: 500;
        font-size: var(--font-size-sm);
        background: rgba(87, 242, 135, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.7);
        color: var(--text-primary);
        height: 46px;
        cursor: default;
        pointer-events: none;
    }

    .subscribed-btn:hover {
        transform: none;
        box-shadow: none;
        background: rgba(87, 242, 135, 0.25);
    }
    .subscribed-btn .subscribed-icon {
        height: 28px;
        width: auto;
    }
</style>