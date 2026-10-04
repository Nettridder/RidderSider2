function initializeFlagIcons(containerId = "flagContainer", config = {}) {
    // Default configuration
    const defaultConfig = {
        circleSize: "50px",
        gap: "16px",
        shadowSpread: "8px",
        shadowOpacity: 0.15
    };

    // Merge with custom config
    const finalConfig = { ...defaultConfig, ...config };

    // Country data array: [country_code, label]
    const countries = [
        ["no", "Norge 1996"],
        ["fo", "Færøyene 2004"],
        ["dk", "Danmark 2007"],
        ["se", "Sverige 2009"],
        ["gb-sct", "Skottland 2012"],
        ["fi", "Finland 2013"],
        ["ee", "Estland 2013"],
        ["is", "Island 2015"],
        ["ie", "Irland 2017"],
        ["at", "Østerrrike 2019"],
        ["sk", "Slovakia 2019"],
        ["hu", "Ungarn 2019"],
        ["de", "Tyskland 2022"],
        ["cz", "Tsjekia 2024"],
        ["pt", "Portugal 2026"]
    ];

    // Get the container
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found`);
        return;
    }

    // Clear container if it has content
    container.innerHTML = "";

    // Create the main flex wrapper
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
        display: flex;
        flex-wrap: nowrap;
        gap: ${finalConfig.gap};
        justify-content: left;
        align-items: center;
        overflow-x: auto;
        padding: 20px 0;
    `;

    // Loop through countries and create flag elements
    countries.forEach(([countryCode, label]) => {
        // Outer container (flex column)
        const itemContainer = document.createElement("div");
        itemContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            min-width: fit-content;
        `;

        // Circle container
        const circle = document.createElement("div");
        circle.style.cssText = `
            width: ${finalConfig.circleSize};
            height: ${finalConfig.circleSize};
            border-radius: 50%;
            background-color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px ${finalConfig.shadowSpread} rgba(0, 0, 0, ${finalConfig.shadowOpacity});
            flex-shrink: 0;
            overflow: hidden;
        `;

        // Image element
        const img = document.createElement("img");
        img.src = `https://flagcdn.com/${countryCode}.svg`;
        img.alt = label;
        img.title = label;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        // Append image to circle
        circle.appendChild(img);

        // Append circle to item container
        itemContainer.appendChild(circle);

        // Append item container to wrapper
        wrapper.appendChild(itemContainer);
    });

    // Append wrapper to container
    container.appendChild(wrapper);
}