<script lang="ts">
    // Future props and state will go here
    // For now, this is a "Coming Soon" placeholder
</script>

<div class="kvk-suite-container">
    <div class="coming-soon-wrapper">
        <div class="coming-soon-card">
            <div class="icon-container">
                <i class="fas fa-tools"></i>
            </div>

            <h2 class="coming-soon-title">Coming Soon</h2>

            <p class="coming-soon-description">
                The KvK Suite is currently under development. This comprehensive toolkit will help you manage and
                optimize your Kingdom vs Kingdom experience.
            </p>

            <div class="features-preview">
                <h3>Planned Features</h3>
                <ul class="feature-list">
                    <li>
                        <i class="fas fa-chart-line"></i>
                        <span>Honor Points Tracker</span>
                    </li>
                    <li>
                        <i class="fas fa-users"></i>
                        <span>Alliance Coordination Tools</span>
                    </li>
                    <li>
                        <i class="fas fa-map-marked-alt"></i>
                        <span>Zone Control Planner</span>
                    </li>
                    <li>
                        <i class="fas fa-calendar-check"></i>
                        <span>KvK Stage Timeline</span>
                    </li>
                    <li>
                        <i class="fas fa-calculator"></i>
                        <span>Kill Point Calculator</span>
                    </li>
                </ul>
            </div>

            <div class="notification-section">
                <p class="stay-tuned">Stay tuned for updates!</p>
            </div>
        </div>
    </div>
</div>

<style>
    .kvk-suite-container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: var(--spacing-4);
    }

    .coming-soon-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
    }

    .coming-soon-card {
        background: rgba(20, 21, 24, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-xl);
        padding: var(--spacing-8);
        text-align: center;
        width: 100%;
        position: relative;
        overflow: hidden;
    }

    .coming-soon-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent-blue), var(--accent-green), var(--accent-blue));
        background-size: 200% 100%;
        animation: gradient-slide 3s ease infinite;
    }

    @keyframes gradient-slide {
        0%,
        100% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
    }

    .icon-container {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--spacing-6);
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon-container i {
        font-size: 2rem;
        color: var(--accent-blue);
    }

    .coming-soon-title {
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--spacing-4);
    }

    .coming-soon-description {
        color: var(--text-secondary);
        font-size: var(--font-size-base);
        line-height: 1.6;
        max-width: 500px;
        margin: 0 auto var(--spacing-8);
    }

    .features-preview {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius-lg);
        padding: var(--spacing-6);
        margin-bottom: var(--spacing-6);
    }

    .features-preview h3 {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--spacing-4);
    }

    .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-3);
        text-align: left;
    }

    .feature-list li {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
        background: rgba(255, 255, 255, 0.02);
        border-radius: var(--radius-md);
        transition: background 0.2s ease;
    }

    .feature-list li:hover {
        background: rgba(59, 130, 246, 0.1);
    }

    .feature-list li i {
        color: var(--accent-blue);
        font-size: var(--font-size-sm);
        width: 20px;
        text-align: center;
    }

    .feature-list li span {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
    }

    .notification-section {
        margin-top: var(--spacing-4);
    }

    .stay-tuned {
        color: var(--accent-green);
        font-weight: 600;
        font-size: var(--font-size-sm);
        margin: 0;
    }

    @media (max-width: 768px) {
        .coming-soon-card {
            padding: var(--spacing-6);
        }

        .feature-list {
            grid-template-columns: 1fr;
        }

        .icon-container {
            width: 60px;
            height: 60px;
        }

        .icon-container i {
            font-size: 1.5rem;
        }
    }
</style>
