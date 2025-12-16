<script>
    import { onMount } from 'svelte';
    
    export let currentPath = "/";

    import santaHat from '../assets/images/navi/santa_hat.webp';
    import logo from '../assets/images/global/logo-new.webp';
    import homeIcon from '../assets/images/navi/navi_home.webp';
    import faqIcon from '../assets/images/navi/navi_question.webp';
    import toolsIcon from '../assets/images/navi/navi_tools.webp';

    import generalIcon from '../assets/images/navi/general.webp';
    import mailIcon from '../assets/images/navi/mail.webp';
    import equipmentIcon from '../assets/images/navi/equipment.webp';
    import speedupsIcon from '../assets/images/navi/speedups.webp';
    import davorIcon from '../assets/images/navi/davor_icon.webp';
    import calendarIcon from '../assets/images/navi/calendar.webp';

    $: isToolsPage = currentPath.startsWith('/tools');
</script>

<nav class="navbar">
    <div class="nav-container">
        <div class="nav-brand">
            <a href="/" style="position: relative; text-decoration: none; color: inherit; display: flex; align-items: center; gap: var(--spacing-2);">
                <img src={santaHat.src} alt="Festive Hat" class="santa-hat" />
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

            <div id="auth-container"></div>
        </div>
    </div>
    
    {#if isToolsPage}
        <div class="sub-navbar" style="opacity: 1; transform: translateY(0);">
            <div class="sub-nav-container">
                <a href="/tools/mail/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/mail')}>
                    <img src={mailIcon.src} alt="Mail" class="sub-nav-icon" width="24" height="24"/>
                    <span class="sub-nav-text">Mail Generator</span>
                </a>
                
                <a href="/tools/calculators/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/calculators')}>
                    <img src={generalIcon.src} alt="General" class="sub-nav-icon" width="24" height="24"/>
                    <span class="sub-nav-text">General Tools</span>
                </a>

                <a href="/tools/equipment/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/equipment')}>
                    <img src={equipmentIcon.src} alt="Equipment" class="sub-nav-icon" width="24" height="24"/>
                    <span class="sub-nav-text">Equipment</span>
                </a>
             
                <a href="/tools/speedups/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/speedups')}>
                    <img src={speedupsIcon.src} alt="Speedups" class="sub-nav-icon" width="24" height="24"/>
                    <span class="sub-nav-text">Speedups</span>
                </a>

                <a href="/tools/davor_toolkit/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/davor_toolkit')}>
                    <img src={davorIcon.src} alt="Davor" class="sub-nav-icon" width="24" height="24"/>
                    <span class="sub-nav-text">Davor's Toolkit</span>
                </a>

                <a href="/tools/calendar/" class="sub-nav-link" class:active={currentPath.startsWith('/tools/calendar')}>
                    <img src={calendarIcon.src} alt="Calendar" class="sub-nav-icon" width="24" height="24"/>
                    <span class="sub-nav-text">Event Calendar</span>
                </a>
            </div>
        </div>
    {/if}
</nav>

<style>
    .sub-nav-container {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        width: 100%;
        padding: 0 2rem;
    }

    .sub-nav-link {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 1 auto; 
        gap: 8px;
        text-decoration: none;
        color: inherit;
        transition: opacity 0.2s;
        padding: 0 10px;
    }

    .sub-nav-link:hover {
        opacity: 0.8;
    }

    .sub-nav-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
    }

    .santa-hat {
        position: absolute;
        left: 7px; 
        top: -5px;
        transform: rotate(-5deg);
        width: 30px;
        height: auto;
        z-index: 10;
        pointer-events: none;
    }

    #auth-container {
        display: flex;
        align-items: center;
        gap: 16px;
        height: 100%;
    }

    :global(#auth-container button), 
    :global(#auth-container a) {
        display: flex;
        align-items: center;
        justify-content: flex-start !important; 
        text-align: left !important;
    }

    @media (max-width: 768px) {
        .sub-nav-text {
            display: none;
        }

        .sub-nav-link {
            flex: 0 1 auto;
            justify-content: center;
        }
        
        .sub-nav-container {
            justify-content: center;
            gap: var(--spacing-5, 25px);
            padding: 0 var(--spacing-2); 
        }

        .sub-nav-icon {
            width: 28px;
            height: 28px;
        }
    }
</style>