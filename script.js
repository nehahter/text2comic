// Configuration for API access
const HUGGING_FACE_API_KEY = "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";
const GEMINI_API_KEY = "AIzaSyD0pTSwDqdqWPRSQ3p45CKLLyN8qxcS2Qc";
let LLM_SERVICE = "gemini"; // Default LLM service - changed to gemini

// Map of comic styles to specific model and styling prompts
const COMIC_STYLES = {
    manga: {
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        prompt: "professional high-quality manga art, monochrome black and white, crisp clean ink lines, dramatic speed lines, detailed crosshatching and screentone shading, strong contrast, cinematic composition, expert panel layout, authentic Japanese manga style, precise character expressions, dynamic action poses, detailed backgrounds, professional illustration quality"
    },
    cartoon: {
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        prompt: "professional cartoon style comic panel, vibrant saturated colors, bold outlines, expressive character design, fluid animation style, clean vectorized aesthetic, professional comic book art, dynamic composition"
    },
    realistic: {
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        prompt: "hyper-realistic comic book art, detailed anatomical illustration, cinematic lighting, dramatic shadows, photorealistic textures, professional comic art, film-like quality, high-end illustration"
    },
    "comic-book": {
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        prompt: "classic comic book style, bold primary colors, strong black ink outlines, dramatic action lines, halftone dots for shading, vintage comic book panel, professional illustration, superhero comic aesthetic"
    }
};

// DOM elements
const scenarioInput = document.getElementById('scenario-input');
const comicStyleSelect = document.getElementById('comic-style');
const generateBtn = document.getElementById('generate-btn');
const comicHistory = document.getElementById('comic-history');
const initialMessage = document.getElementById('initial-message');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const randomScenarioBtn = document.getElementById('random-scenario-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

// Random scenario collection
const RANDOM_SCENARIOS = [
    "A wizard accidentally turns their cat into a dragon in a cluttered magical library",
    "An astronaut and a deep sea diver comparing their experiences at a coffee shop",
    "A group of pets planning an elaborate escape from a veterinary office",
    "A robot learning to cook from an Italian grandmother in her traditional kitchen",
    "Two time travelers from different eras meeting at a modern shopping mall",
    "A superhero on their day off dealing with mundane household problems",
    "A vampire and werewolf as roommates arguing about the thermostat settings",
    "A detective interrogating fairy tale characters about a stolen golden egg",
    "An alien tourist taking selfies at famous Earth landmarks while locals stare",
    "A knight and a dragon becoming business partners to open a barbecue restaurant",
    "A pirate crew discovering buried treasure that turns out to be a time capsule",
    "A scientist accidentally shrinks themselves and navigates their own laboratory",
    "A ghost trying to communicate with a tech-obsessed teenager who won't look up from their phone",
    "Animals at a zoo organizing a talent show after the humans leave",
    "A fantasy adventurer applying modern business strategies to their quest",
    "Two rival supervillains meeting at their children's school parent-teacher conference",
    "A caveman transported to modern times learning to use technology",
    "An AI assistant and a medieval blacksmith collaborating on a project",
    "A cowboy and a samurai comparing their fighting techniques and philosophies",
    "A mermaid taking swimming lessons from a confused human instructor"
];

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Store API keys in localStorage for future use
    localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
    localStorage.setItem('hf_api_key', HUGGING_FACE_API_KEY);
    
    // Check if LLM service is stored
    if (localStorage.getItem('llm_service')) {
        LLM_SERVICE = localStorage.getItem('llm_service');
    } else {
        // Default to Gemini
        LLM_SERVICE = "gemini";
        localStorage.setItem('llm_service', LLM_SERVICE);
    }
    
    // Theme settings
    initializeTheme();
    
    generateBtn.addEventListener('click', generateComic);
    
    // Add service selection if available in DOM
    const serviceSelect = document.getElementById('llm-service');
    if (serviceSelect) {
        // Update options to show Gemini instead of OpenAI
        const options = serviceSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === 'openai') {
                option.textContent = 'Gemini';
                option.value = 'gemini';
            }
        });
        
        serviceSelect.value = LLM_SERVICE;
        serviceSelect.addEventListener('change', () => {
            LLM_SERVICE = serviceSelect.value;
            localStorage.setItem('llm_service', LLM_SERVICE);
        });
    }
    
    // Clear history button
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the comic history?')) {
                comicHistory.innerHTML = '';
                toggleInitialMessage(true);
            }
        });
    }
    
    // Random scenario button
    if (randomScenarioBtn) {
        randomScenarioBtn.addEventListener('click', generateRandomScenario);
    }
    
    // Theme toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Check if we have comics already
    toggleInitialMessage(comicHistory.children.length === 0);
});

// Initialize theme based on user preference or system preference
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeToggleIcon(true);
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        updateThemeToggleIcon(false);
    } else {
        // Check if user prefers dark mode
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
            document.body.classList.add('dark-theme');
            updateThemeToggleIcon(true);
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            updateThemeToggleIcon(false);
            localStorage.setItem('theme', 'light');
        }
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        // Switch to light theme
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        updateThemeToggleIcon(false);
    } else {
        // Switch to dark theme
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        updateThemeToggleIcon(true);
    }
}

// Update the theme toggle icon based on current theme
function updateThemeToggleIcon(isDarkTheme) {
    if (!themeToggleBtn) return;
    
    const iconElement = themeToggleBtn.querySelector('i');
    if (iconElement) {
        if (isDarkTheme) {
            iconElement.className = 'fas fa-sun';
        } else {
            iconElement.className = 'fas fa-moon';
        }
    }
}

// Toggle initial message visibility
function toggleInitialMessage(show) {
    if (initialMessage) {
        initialMessage.style.display = show ? 'block' : 'none';
    }
}

// Show/hide loading overlay
function toggleLoadingOverlay(show) {
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.style.display = 'flex';
            // Use setTimeout to ensure display:flex is applied before changing opacity
            setTimeout(() => {
                loadingOverlay.classList.add('visible');
            }, 10);
        } else {
            loadingOverlay.classList.remove('visible');
            // Wait for transition to complete before hiding
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300); // Match this with the CSS transition duration
        }
    }
}

// Main function to generate the comic
async function generateComic() {
    const scenario = scenarioInput.value.trim();
    const comicStyle = comicStyleSelect.value;
    
    if (!scenario) {
        alert("Please enter a scenario first!");
        return;
    }
    
    // Validate scenario length
    if (scenario.length < 10) {
        alert("Please enter a more detailed scenario for better results!");
        return;
    }
    
    // Show loading overlay
    toggleLoadingOverlay(true);
    
    try {
        // Step 1: Generate a structured comic scenario from user input
        let structuredScenario;
        try {
            // Try using Gemini API first
            structuredScenario = await generateStructuredScenario(scenario);
        } catch (error) {
            console.error("Gemini API failed, using direct text generation:", error);
            // If Gemini fails, use direct text generation
            structuredScenario = generateDirectScenario(scenario);
        }
        
        // Step 2: Generate images for each panel
        const panelImages = await generatePanelImages(structuredScenario, comicStyle);
        
        // Step 3: Create and display the comic strip
        createComicStrip(scenario, structuredScenario, panelImages);
        
        // Clear input
        scenarioInput.value = '';
        
        // Hide initial message if visible
        toggleInitialMessage(false);
    } catch (error) {
        console.error('Error generating comic:', error);
        alert(`Error: ${error.message || 'Failed to generate comic'}. Please try again.`);
    } finally {
        // Hide loading overlay
        toggleLoadingOverlay(false);
    }
}

// Function to generate structured scenario using Gemini API
async function generateStructuredScenario(scenario) {
    const apiKey = 'AIzaSyD0pTSwDqdqWPRSQ3p45CKLLyN8qxcS2Qc';
    const apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
    const prompt = `
    Create a 4-panel comic strip based on this scenario: "${scenario}".
    
    IMPORTANT REQUIREMENTS:
    1. Create EXACTLY 4 panels that tell a complete story with a clear beginning, development, and conclusion
    2. Maintain consistent character descriptions and scene details across all panels
    3. Each panel must advance the story logically with clear progression
    4. Use EXPRESSIVE, DYNAMIC dialogue with exclamation marks, varied punctuation, and emotion
    
    CHARACTER CREATION:
    First, identify and describe ALL main characters in detail:
    - Physical appearance (hair color, eye color, body type, height)
    - Clothing and accessories (be specific about colors and styles)
    - Distinctive features or unique characteristics
    - Strong personality traits that affect expressions and dialogue style
    - Unique speech patterns or verbal tics for each character
    
    SCENE SETUP:
    Define the main setting with specific details:
    - Location description (indoor/outdoor, specific place)
    - Time of day and lighting conditions
    - Important background elements
    - Any props or objects that will appear in multiple panels
    - Atmosphere and mood of the setting
    
    PANEL STRUCTURE:
    For each of the 4 panels, provide:
    1. Scene Description:
       - Maintain consistent setting details
       - Describe any changes in lighting or perspective
       - Include all relevant background elements
       - Note any new props or objects that appear
       - Describe dynamic action and movement
    
    2. Character Positions:
       - Specify exact positions (left/center/right)
       - Describe any movement or action between panels
       - Maintain consistent character appearances
       - Include character body language and posture
    
    3. Character Expressions:
       - Make expressions HIGHLY DYNAMIC and EMOTIONAL
       - Match expressions precisely to the story progression
       - Be specific about facial features (eyes, eyebrows, mouth, etc.)
       - Show emotional changes and reactions across panels
       - Include gestures and body language
    
    4. Dialogue:
       - Make dialogue EXTREMELY EXPRESSIVE and NATURAL
       - Use EXCLAMATIONS and varied punctuation (!, ..., ?!, etc.)
       - Add emotion indicators (laughs, gasps, sighs)
       - Make dialogue character-specific matching their personality
       - Use dialogue to advance the story with tension/humor
       - Specify which character is speaking
       - Position speech bubbles appropriately
       - Include thoughts or inner monologues where appropriate
       - Use dialogue that SHOWS character relationships and emotions
    
    Return as a JSON object with this exact structure:
    {
      "characters": {
        "character_name1": {
          "appearance": "detailed physical description",
          "clothing": "detailed clothing description",
          "personality": "brief personality traits and speech style"
        }
      },
      "setting": {
        "location": "detailed location description",
        "time": "time of day and lighting",
        "mood": "atmosphere and emotional tone of setting",
        "background_elements": ["list of important background items"]
      },
      "panels": [
        {
          "scene_description": "detailed visual description maintaining consistency",
          "character_positions": {"character_name": "position in frame with action/posture"},
          "character_expressions": {"character_name": "detailed emotional facial expression"},
          "dialogue": {
            "text": "EXPRESSIVE dialogue text with varied punctuation!",
            "position": "bubble position",
            "character": "speaking character",
            "style": "emotional tone of speech (excited, whispering, etc.)"
          }
        }
      ]
    }
    `;
    
    console.log('Calling Gemini API with prompt...');
    
    try {
        // Create a timeout promise to handle API hanging
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API request timed out after 20 seconds')), 20000)
        );
        
        // Create the API request promise
        const apiRequestPromise = fetch(`${apiEndpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2000
                }
            })
        });
        
        // Race between timeout and API request
        const response = await Promise.race([apiRequestPromise, timeoutPromise]);
        
        // Log the response status for debugging
        console.log('Gemini API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error response:', errorText);
            
            // Check for specific error types
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            } else if (response.status === 404) {
                throw new Error('API endpoint not found. The Gemini API endpoint may have changed.');
            } else if (response.status === 403) {
                throw new Error('API key invalid or unauthorized access. Please check your API key.');
            } else {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log('Gemini API response received successfully');
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            console.error('Invalid response structure from Gemini API:', data);
            throw new Error('Invalid response from Gemini API - missing candidates or content');
        }
        
        let text = data.candidates[0].content.parts[0].text;
        console.log('Extracting JSON from Gemini response text');
        
        let structuredScenario = extractJSONFromText(text);
        console.log('JSON extracted successfully');
        
        // Validate and normalize the scenario
        const normalizedScenario = validateAndNormalizeScenario(structuredScenario);
        console.log('Scenario structure validated and normalized');
        
        return normalizedScenario;
    } catch (error) {
        console.error('Error generating structured scenario with Gemini:', error);
        
        // If it's a network error, provide a more specific message
        if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            throw new Error('Network error when connecting to Gemini API. Please check your internet connection.');
        }
        
        // If it's a timeout error from our Promise.race, fallback gracefully
        if (error.message.includes('timed out')) {
            console.log('Gemini API timed out, falling back to direct generation');
            return generateDirectScenario(scenario);
        }
        
        throw error;
    }
}

// Generate images for each panel using Stable Diffusion via Hugging Face
async function generatePanelImages(structuredScenario, style) {
    const panelImages = [];
    const styleConfig = COMIC_STYLES[style] || COMIC_STYLES.cartoon;
    
    // Get character baseline descriptions to ensure consistency
    const characterDescriptions = {};
    if (structuredScenario.characters) {
        Object.entries(structuredScenario.characters).forEach(([name, description]) => {
            if (typeof description === 'object') {
                const details = [];
                if (description.appearance) details.push(description.appearance);
                if (description.clothing) details.push(description.clothing);
                characterDescriptions[name] = details.join(', ');
            } else {
                characterDescriptions[name] = description;
            }
        });
    }
    
    // Get setting details if available
    let settingDescription = "";
    if (structuredScenario.setting) {
        const setting = structuredScenario.setting;
        const settingDetails = [];
        if (setting.location) settingDetails.push(setting.location);
        if (setting.time) settingDetails.push(setting.time);
        if (Array.isArray(setting.background_elements) && setting.background_elements.length > 0) {
            settingDetails.push(`with ${setting.background_elements.join(', ')}`);
        }
        settingDescription = settingDetails.join(' ');
    }
    
    // First analyze all panels to identify common elements for consistency
    const commonElements = {
        characters: new Set(),
        locations: new Set(),
        actions: new Set()
    };
    
    structuredScenario.panels.forEach(panel => {
        // Add characters to common elements
        if (panel.character_positions) {
            Object.keys(panel.character_positions).forEach(char => commonElements.characters.add(char));
        }
        
        // Try to extract location from scene description
        const sceneDesc = panel.scene_description || '';
        const locationMatches = sceneDesc.match(/at (?:the |a )?([\w\s]+)/ ) || 
                            sceneDesc.match(/in (?:the |a )?([\w\s]+)/) ||
                            sceneDesc.match(/(indoor|outdoor|inside|outside|room|kitchen|bedroom|office|garden|park|street)/i);
                            
        if (locationMatches && locationMatches[1]) {
            commonElements.locations.add(locationMatches[1].trim());
        }
        
        // Extract common actions for consistent style
        const actionMatches = sceneDesc.match(/(?:is |are )?([\w]+ing)/) || 
                           sceneDesc.match(/(talk|walk|run|sit|stand|look|move|jump|dance|fight)/i);
        if (actionMatches && actionMatches[1]) {
            commonElements.actions.add(actionMatches[1].trim());
        }
    });
    
    // Convert sets to arrays for easier use
    const commonCharacters = Array.from(commonElements.characters);
    const commonLocations = Array.from(commonElements.locations);
    const commonActions = Array.from(commonElements.actions);
    
    // Add common elements to setting description if not already present
    if (commonLocations.length > 0 && !settingDescription.includes(commonLocations[0])) {
        settingDescription += settingDescription ? `, in ${commonLocations.join(' or ')}` : `In ${commonLocations.join(' or ')}`;
    }
    
    for (let i = 0; i < structuredScenario.panels.length; i++) {
        const panel = structuredScenario.panels[i];
        try {
            // Create a detailed scene description
            const sceneDesc = panel.scene_description || `Scene ${i+1}`;
            
            // Create detailed character descriptions for this panel
            let characterDetails = "";
            if (panel.character_positions) {
                const characterNames = Object.keys(panel.character_positions);
                
                for (const name of characterNames) {
                    const position = panel.character_positions[name] || "center";
                    const expression = panel.character_expressions && panel.character_expressions[name] 
                        ? panel.character_expressions[name] 
                        : "";
                        
                    // Add detailed character info from baseline plus panel-specific details
                    if (characterDescriptions[name]) {
                        characterDetails += `, ${name} (${characterDescriptions[name]}) positioned at ${position}${expression ? ` with ${expression} expression` : ''}`;
                    } else {
                        characterDetails += `, ${name} positioned at ${position}${expression ? ` with ${expression} expression` : ''}`;
                    }
                }
            }
            
            // Add dialogue context if available
            let dialogueContext = "";
            if (panel.dialogue && panel.dialogue.text && panel.dialogue.text.trim() !== "") {
                const speaker = panel.dialogue.character || "character";
                const text = panel.dialogue.text.trim();
                if (text.length < 50) { // Only add short dialogue to not overload the prompt
                    dialogueContext = `, ${speaker} saying "${text}"`;
                }
            }
            
            // Craft a detailed prompt with sequential context
            let sequenceContext = "";
            if (i > 0) {
                sequenceContext = `, continuing from previous panel`;
                
                // Add specific continuity details if possible
                if (i > 0 && structuredScenario.panels[i-1].dialogue && structuredScenario.panels[i-1].dialogue.text) {
                    const prevDialogue = structuredScenario.panels[i-1].dialogue.text.trim();
                    if (prevDialogue.length < 30) {
                        sequenceContext += ` after "${prevDialogue}"`;
                    }
                }
            }
            
            // Add setting information
            let settingContext = settingDescription ? `, ${settingDescription}` : "";
            
            // Add stylistic elements based on panel position (first, middle, last)
            let panelStyleContext = "";
            if (i === 0) {
                panelStyleContext = ", establishing shot, introduction of characters and setting";
            } else if (i === structuredScenario.panels.length - 1) {
                panelStyleContext = ", resolution shot, emotional conclusion";
            } else {
                panelStyleContext = ", story development, dynamic interaction";
            }
            
            // Add art direction based on comic style
            let artDirection = "";
            if (style === "manga") {
                artDirection = ", manga panel composition, dramatic speed lines, impact lines radiating from focal point, crosshatching for shadows, dynamic camera angles, screentone patterns, authentic manga layout, emotional close-ups";
            } else if (style === "comic-book") {
                artDirection = ", dynamic superhero poses, dramatic perspective, action panel layout";
            } else if (style === "realistic") {
                artDirection = ", photorealistic details, cinematic composition, dramatic lighting";
            }
            
            // Create a detailed prompt for better image generation
            const prompt = `${styleConfig.prompt}, ${sceneDesc}${settingContext}${characterDetails}${dialogueContext}${sequenceContext}${panelStyleContext}${artDirection}, professional comic art, single cohesive scene, no text, no speech bubbles, no borders, detailed illustration, masterpiece quality`;
            
            console.log(`Generating image for panel ${i+1} with prompt: ${prompt}`);
            
            // Generate the image for this panel
            const imageUrl = await generateImage(prompt, styleConfig.model);
            
            if (imageUrl) {
                panelImages.push(imageUrl);
                console.log(`Successfully generated image for panel ${i+1}`);
            } else {
                // If image generation failed, use placeholder
                console.error(`Failed to generate image for panel ${i+1}`);
                panelImages.push(`https://via.placeholder.com/512x512?text=Panel+${i+1}`);
            }
        } catch (error) {
            console.error(`Error generating image for panel ${i+1}:`, error);
            panelImages.push(`https://via.placeholder.com/512x512?text=Panel+${i+1}`);
        }
    }
    
    return panelImages;
}

// Generate image using Hugging Face API
async function generateImage(prompt, model) {
    try {
        console.log('Starting image generation with model:', model);
        
        // Timeout promise to handle API hanging - increased from 45s to 90s
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image API request timed out')), 90000)
        );
        
        // Actual API request with improved retry logic
        async function attemptFetch(retries = 5) { // Increased retries from 3 to 5
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    console.log(`Attempt ${attempt + 1} for image generation with model ${model}`);
                    
                    // Add a small delay between attempts to prevent rate limiting
                    if (attempt > 0) {
                        const delayTime = Math.min(2000 * Math.pow(1.5, attempt), 10000);
                        console.log(`Waiting ${delayTime}ms before attempt ${attempt + 1}`);
                        await new Promise(resolve => setTimeout(resolve, delayTime));
                    }
                    
                    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
                            "Content-Type": "application/json",
                            "X-Use-Cache": "true" // Explicitly request cached results if available
                        },
                        body: JSON.stringify({
                            inputs: prompt,
                            parameters: {
                                num_inference_steps: 30,           // Reduced from 40 to 30 for faster generation
                                guidance_scale: 7.5,               // Balanced guidance scale
                                width: 512,
                                height: 512,
                                negative_prompt: "blurry, low quality, deformed, ugly, bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, missing fingers, messy drawing, text, watermark, signature"
                            },
                            options: {
                                wait_for_model: true,              // Wait for model to load
                                use_cache: true                    // Use cached results
                            }
                        })
                    });
                    
                    console.log(`Image generation attempt ${attempt + 1} response status:`, response.status);
                    
                    // Check if the model is still loading
                    if (response.status === 503) {
                        const errorData = await response.json().catch(e => ({ error: "Failed to parse error response" }));
                        console.log('503 response data:', errorData);
                        if (errorData.error && errorData.error.includes("loading")) {
                            console.log(`Model still loading, attempt ${attempt + 1} of ${retries}`);
                            // Wait for model to load (with exponential backoff but capped at 15 seconds)
                            await new Promise(resolve => setTimeout(resolve, Math.min(3000 * Math.pow(1.5, attempt), 15000)));
                            continue; // Try again
                        }
                    }
                    
                    // Handle 500 errors - server error or model failure
                    if (response.status === 500) {
                        console.log(`Server error (500), attempt ${attempt + 1} of ${retries}`);
                        // Use a longer wait time for 500 errors
                        await new Promise(resolve => setTimeout(resolve, Math.min(4000 * Math.pow(1.5, attempt), 20000)));
                        
                        // If we're on the last two attempts, try a different model as fallback
                        if (attempt >= retries - 2) {
                            console.log('Multiple 500 errors, trying alternative model');
                            return tryAlternativeModel(prompt, model);
                        }
                        continue; // Try again
                    }
                    
                    // Handle 429 rate limit errors
                    if (response.status === 429) {
                        console.log(`Rate limit (429), attempt ${attempt + 1} of ${retries}`);
                        // Use a longer wait time for rate limit errors
                        await new Promise(resolve => setTimeout(resolve, Math.min(5000 * Math.pow(2, attempt), 30000)));
                        continue; // Try again
                    }
                    
                    if (!response.ok) {
                        const errorText = await response.text().catch(e => 'Failed to get error text');
                        console.error(`API error (${response.status}):`, errorText);
                        
                        // If we're on the last attempt, try an alternative model
                        if (attempt >= retries - 2) {
                            console.log('Persistent API errors, trying alternative model');
                            return tryAlternativeModel(prompt, model);
                        }
                        
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    
                    // Get image blob and convert to data URL
                    const blob = await response.blob();
                    console.log(`Received blob of size: ${blob.size} bytes`);
                    
                    if (blob.size < 1000) {
                        console.error('Generated image is too small or invalid:', blob.size);
                        if (attempt >= retries - 2) {
                            console.log('Multiple invalid images, trying alternative model');
                            return tryAlternativeModel(prompt, model);
                        }
                        throw new Error('Generated image is too small or invalid');
                    }
                    
                    const imageUrl = URL.createObjectURL(blob);
                    console.log('Image generated successfully, URL created');
                    return imageUrl;
                } catch (error) {
                    console.error(`Attempt ${attempt + 1} failed:`, error);
                    
                    // If we're on the last attempt, try alternative model
                    if (attempt >= retries - 2) {
                        console.log('Multiple failures, trying alternative model');
                        return tryAlternativeModel(prompt, model);
                    }
                    
                    // Wait a bit before retrying (with exponential backoff capped at 12 seconds)
                    await new Promise(resolve => setTimeout(resolve, Math.min(2000 * Math.pow(1.5, attempt), 12000)));
                }
            }
            
            // If we get here, all attempts failed
            console.log('All regular attempts failed, trying alternative model as last resort');
            return tryAlternativeModel(prompt, model);
        }
        
        // Try alternative model if the original one fails
        async function tryAlternativeModel(prompt, originalModel) {
            console.log('Trying alternative model for better stability');
            
            // Use a different model based on the original model
            const alternativeModels = [
                "SG161222/Realistic_Vision_V5.1_noVAE", 
                "stabilityai/stable-diffusion-xl-base-1.0",
                "runwayml/stable-diffusion-v1-5",
                "CompVis/stable-diffusion-v1-4"
            ];
            
            // Filter out the original model and pick a different one
            const availableAlternatives = alternativeModels.filter(m => m !== originalModel);
            const alternativeModel = availableAlternatives[0]; // Use the first alternative
                
            console.log(`Using alternative model: ${alternativeModel}`);
                
            try {
                // Use a simplified prompt for the alternative model
                const simplifiedPrompt = prompt.split(',').slice(0, 10).join(',');
                
                const response = await fetch(`https://api-inference.huggingface.co/models/${alternativeModel}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
                        "Content-Type": "application/json",
                        "X-Use-Cache": "true"
                    },
                    body: JSON.stringify({
                        inputs: simplifiedPrompt,
                        parameters: {
                            num_inference_steps: 25, // Reduced steps for faster generation
                            guidance_scale: 7.0,
                            width: 512,
                            height: 512,
                            negative_prompt: "blurry, low quality, deformed, ugly, bad anatomy"
                        },
                        options: {
                            use_cache: true
                        }
                    })
                });
                
                console.log('Alternative model response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text().catch(e => 'Failed to get error text');
                    console.error('Alternative model failed:', errorText);
                    
                    // Try other alternatives if available
                    if (availableAlternatives.length > 1) {
                        console.log('Trying next alternative model');
                        const nextAlternative = availableAlternatives[1];
                        
                        // Simple retry with next alternative
                        const retryResponse = await fetch(`https://api-inference.huggingface.co/models/${nextAlternative}`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                inputs: simplifiedPrompt,
                                parameters: {
                                    num_inference_steps: 20,
                                    guidance_scale: 7.0,
                                    width: 512,
                                    height: 512
                                }
                            })
                        });
                        
                        if (retryResponse.ok) {
                            const retryBlob = await retryResponse.blob();
                            if (retryBlob.size > 1000) {
                                return URL.createObjectURL(retryBlob);
                            }
                        }
                    }
                    
                    throw new Error('Alternative model also failed');
                }
                
                const blob = await response.blob();
                console.log(`Alternative model returned blob of size: ${blob.size} bytes`);
                
                if (blob.size < 1000) {
                    console.error('Generated image from alternative model is too small or invalid');
                    throw new Error('Generated image is too small or invalid');
                }
                
                const imageUrl = URL.createObjectURL(blob);
                console.log('Alternative model generated image successfully');
                return imageUrl;
            } catch (error) {
                console.error('All alternative models also failed:', error);
                console.log('Falling back to placeholder image');
                return generateFallbackImage(prompt);
            }
        }
        
        // Race between timeout and fetch with retries
        return await Promise.race([attemptFetch(), timeoutPromise])
            .catch(error => {
                console.error('Image generation timed out or failed completely:', error);
                console.log('Using fallback image generation');
                return generateFallbackImage(prompt);
            });
    } catch (error) {
        console.error('Error in generateImage:', error);
        return generateFallbackImage(prompt);
    }
}

// Generate a fallback image when Hugging Face API fails
function generateFallbackImage(prompt) {
    console.log('Using fallback image generation for prompt:', prompt.substring(0, 50) + '...');
    
    // Extract key elements from the prompt
    const keywords = prompt.split(',').slice(0, 3).join(' ');
    
    // Use a Robohash-like fallback with seed based on prompt
    const seed = Array.from(prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Determine a style based on the seed
    const styles = ['set1', 'set2', 'set3', 'set4'];
    const style = styles[seed % styles.length];
    
    // Return from different services based on prompt contents to get variety
    if (prompt.includes('manga') || prompt.includes('anime')) {
        return `https://robohash.org/${encodeURIComponent(keywords)}?set=set1&size=512x512&bgset=bg1`;
    } else if (prompt.includes('cartoon')) {
        return `https://robohash.org/${encodeURIComponent(keywords)}?set=set2&size=512x512&bgset=bg2`;
    } else if (prompt.includes('realistic')) {
        return `https://robohash.org/${encodeURIComponent(keywords)}?set=set3&size=512x512`;
    } else {
        return `https://robohash.org/${encodeURIComponent(keywords)}?set=${style}&size=512x512`;
    }
}

// Helper function to extract JSON from text response
function extractJSONFromText(text) {
    try {
        // Try to parse the entire text as JSON first
        try {
            return JSON.parse(text);
        } catch (e) {
            console.log("Initial JSON parse failed, trying to extract JSON from text");
        }
        
        // Remove special characters and format that might cause issues
        const cleanText = text.replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
                               .replace(/\{(\s*\w+\s*\})/g, '{"character": "$1"}') // Fix broken JSON
                               .replace(/\{(\))/g, '\\{$1') // Escape unmatched braces
                               .replace(/(\()\}/g, '$1\\}') // Escape unmatched braces
                               .replace(/\{\s*\}/g, '{"character": "unnamed"}'); // Replace empty objects
        
        // Look for JSON object with both characters and panels (our format)
        const fullObjectMatch = cleanText.match(/\{[\s\S]*"characters"[\s\S]*"panels"[\s\S]*\}/);
        if (fullObjectMatch) {
            try {
                const jsonStr = fullObjectMatch[0].replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
                                                 .replace(/\s*,\s*}/g, '}')         // Fix trailing commas
                                                 .replace(/\s*,\s*]/g, ']')
                                                 .replace(/(\{|\[|\]|\}|,|\:)/g, ' $1 ') // Add spaces around JSON punctuation
                                                 .replace(/\s+/g, ' ')  // Normalize whitespace
                                                 .replace(/([{,]\s*)([\w]+)(\s*:)/g, '$1"$2"$3') // Ensure property names are quoted
                                                 .replace(/"\s*:/g, '":')        // Fix spacing around colons
                                                 .replace(/([^\\])"/g, '$1\\"')  // Escape unescaped quotes inside strings
                                                 .replace(/""/g, '"')           // Fix double quotes
                                                 .replace(/\\"/g, '"')          // Restore actual quotes
                                                 .replace(/"\{/g, '{')          // Fix opening braces in strings
                                                 .replace(/\}"/g, '}')          // Fix closing braces in strings
                                                 .replace(/"\[/g, '[')          // Fix opening brackets in strings
                                                 .replace(/\]"/g, ']');         // Fix closing brackets in strings
                                                 
                // Remove special character escape sequences that might break JSON parsing
                const safeJsonStr = jsonStr.replace(/\\([^"\\/bfnrtu])/g, '$1');
                                                 
                return JSON.parse(safeJsonStr);
            } catch (e) {
                console.error('Error parsing full object format:', e);
            }
        }
        
        // Try to find JSON directly in the text (array or object)
        const jsonMatch = cleanText.match(/(\{|\[)[\s\S]*?(\}|\])/);
        if (jsonMatch) {
            try {
                const jsonStr = jsonMatch[0].replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
                                           .replace(/\s*,\s*}/g, '}')         // Fix trailing commas
                                           .replace(/\s*,\s*]/g, ']')
                                           .replace(/(\{|\[|\]|\}|,|\:)/g, ' $1 ') // Add spaces around JSON punctuation
                                           .replace(/\s+/g, ' ')  // Normalize whitespace
                                           .replace(/([{,]\s*)([\w]+)(\s*:)/g, '$1"$2"$3') // Ensure property names are quoted
                                           .replace(/"\s*:/g, '":')        // Fix spacing around colons
                                           .replace(/([^\\])"/g, '$1\\"')  // Escape unescaped quotes inside strings
                                           .replace(/""/g, '"')           // Fix double quotes
                                           .replace(/\\"/g, '"')          // Restore actual quotes;
                
                const safeJsonStr = jsonStr.replace(/\\([^"\\/bfnrtu])/g, '$1');
                const parsed = JSON.parse(safeJsonStr);
                
                // If it's an array but we need an object structure, convert it
                if (Array.isArray(parsed)) {
                    return {
                        characters: {},
                        panels: parsed
                    };
                }
                
                return parsed;
            } catch (e) {
                console.error('Error parsing matched JSON:', e);
            }
        }
        
        // Try to find JSON within code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            try {
                const jsonStr = codeBlockMatch[1].trim()
                                               .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
                                               .replace(/\s*,\s*}/g, '}')       // Fix trailing commas
                                               .replace(/\s*,\s*]/g, ']')
                                               .replace(/(\{|\[|\]|\}|,|\:)/g, ' $1 ') // Add spaces
                                               .replace(/\s+/g, ' ')  // Normalize whitespace
                                               .replace(/([{,]\s*)([\w]+)(\s*:)/g, '$1"$2"$3'); // Ensure property names are quoted
                
                const safeJsonStr = jsonStr.replace(/\\([^"\\/bfnrtu])/g, '$1');
                const parsed = JSON.parse(safeJsonStr);
                
                // If it's an array but we need an object structure, convert it
                if (Array.isArray(parsed)) {
                    return {
                        characters: {},
                        panels: parsed
                    };
                }
                
                return parsed;
            } catch (e) {
                console.error('Error parsing code block:', e);
            }
        }
        
        // As a final resort, attempt to extract and normalize the JSON structure
        // This is a more aggressive approach for severely malformed JSON
        if (cleanText.includes('"characters"') && cleanText.includes('"panels"')) {
            try {
                // Create a base structure
                const result = {
                    characters: {},
                    setting: {},
                    panels: []
                };
                
                // Extract characters section using regex
                const charactersMatch = cleanText.match(/"characters"\s*:\s*{([^}]+)}/);
                if (charactersMatch) {
                    const characterEntries = charactersMatch[1].split(/,(?=\s*"[^"]+"\s*:)/);
                    characterEntries.forEach(entry => {
                        const keyValueMatch = entry.match(/"([^"]+)"\s*:\s*(.+)/);
                        if (keyValueMatch) {
                            const key = keyValueMatch[1];
                            const value = keyValueMatch[2].trim();
                            // Handle nested character objects
                            if (value.startsWith('{') && value.endsWith('}')) {
                                try {
                                    result.characters[key] = JSON.parse(value);
                                } catch (e) {
                                    result.characters[key] = value;
                                }
                            } else {
                                result.characters[key] = value;
                            }
                        }
                    });
                }
                
                // Extract panels array using regex
                const panelsMatch = cleanText.match(/"panels"\s*:\s*\[([\s\S]+?)\]\s*(?:,|\})/);
                if (panelsMatch) {
                    // Split panel objects, respecting nested JSON structure
                    let panelsText = panelsMatch[1];
                    let depth = 0;
                    let currentPanel = '';
                    let panels = [];
                    
                    for (let i = 0; i < panelsText.length; i++) {
                        const char = panelsText[i];
                        if (char === '{') depth++;
                        if (char === '}') depth--;
                        
                        currentPanel += char;
                        
                        if (depth === 0 && char === '}') {
                            panels.push(currentPanel.trim());
                            currentPanel = '';
                            // Skip comma and whitespace after object
                            while (i + 1 < panelsText.length && (panelsText[i + 1] === ',' || panelsText[i + 1] === ' ')) {
                                i++;
                            }
                        }
                    }
                    
                    // Process each panel
                    panels.forEach(panelStr => {
                        try {
                            const cleanedPanelStr = panelStr.replace(/[\u201C\u201D]/g, '"')
                                                           .replace(/\s*,\s*}/g, '}')
                                                           .replace(/([{,]\s*)([\w]+)(\s*:)/g, '$1"$2"$3');
                            const panel = JSON.parse(cleanedPanelStr);
                            result.panels.push(panel);
                        } catch (e) {
                            console.error('Error parsing panel:', e);
                            // Create a basic panel object if parsing fails
                            result.panels.push({
                                scene_description: "Scene description",
                                character_positions: {},
                                character_expressions: {},
                                dialogue: { text: "", position: "bottom-center" }
                            });
                        }
                    });
                }
                
                // If we have at least some structure, return it
                if (Object.keys(result.characters).length > 0 || result.panels.length > 0) {
                    return result;
                }
            } catch (error) {
                console.error('Error in aggressive JSON extraction:', error);
            }
        }
        
        // If all parsing attempts fail, create a default structure
        return {
            characters: { "character": "A character in the story" },
            setting: { "location": "A story setting" },
            panels: Array(4).fill().map((_, i) => ({
                scene_description: `Scene description for panel ${i+1}`,
                character_positions: { "character": "center" },
                character_expressions: { "character": "neutral" },
                dialogue: { 
                    text: "Dialogue text",
                    position: "bottom-center",
                    character: "character"
                }
            }))
        };
    } catch (error) {
        console.error('Failed to extract JSON from text:', error);
        throw error;
    }
}

// Helper function to validate and normalize the scenario structure
function validateAndNormalizeScenario(scenario) {
    // Initialize with default structure if needed
    if (!scenario || typeof scenario !== 'object') {
        scenario = { 
            characters: {},
            panels: []
        };
    }
    
    // Ensure characters object exists
    if (!scenario.characters || typeof scenario.characters !== 'object') {
        scenario.characters = {};
    }
    
    // Handle case where scenario might be an array of panels (old format)
    if (Array.isArray(scenario)) {
        scenario = {
            characters: {},
            panels: scenario
        };
    }
    
    // Ensure panels array exists
    if (!scenario.panels || !Array.isArray(scenario.panels)) {
        scenario.panels = [];
    }
    
    // Ensure we have exactly 4 panels
    while (scenario.panels.length < 4) {
        // Add panels to reach required count
        scenario.panels.push({
            scene_description: `Continuation of the story - Panel ${scenario.panels.length + 1}`,
            character_positions: {},
            character_expressions: {},
            dialogue: { text: "...", position: "bottom-center" }
        });
    }
    
    // Limit to exactly 4 panels
    if (scenario.panels.length > 4) {
        scenario.panels.splice(4); // Keep only the first 4 panels
    }
    
    // Validate and normalize each panel
    scenario.panels.forEach((panel, index) => {
        if (!panel.scene_description) {
            panel.scene_description = `Scene ${index + 1}`;
        }
        
        if (!panel.character_positions || typeof panel.character_positions !== 'object') {
            panel.character_positions = {};
        }
        
        if (!panel.character_expressions || typeof panel.character_expressions !== 'object') {
            panel.character_expressions = {};
        }
        
        // Normalize dialogue format
        if (typeof panel.dialogue === 'string') {
            panel.dialogue = {
                text: enhanceDialogue(panel.dialogue, index),
                position: "bottom-center",
                style: determineDialogueStyle(panel.dialogue)
            };
        } else if (!panel.dialogue || typeof panel.dialogue !== 'object') {
            panel.dialogue = {
                text: "",
                position: "bottom-center",
                style: "neutral"
            };
        } else {
            // Enhance existing dialogue text to be more expressive if needed
            if (panel.dialogue.text) {
                panel.dialogue.text = enhanceDialogue(panel.dialogue.text, index);
            } else {
                panel.dialogue.text = "";
            }
            
            if (!panel.dialogue.position) {
                panel.dialogue.position = "bottom-center";
            }
            
            if (!panel.dialogue.style) {
                panel.dialogue.style = determineDialogueStyle(panel.dialogue.text);
            }
        }
    });
    
    return scenario;
}

// Function to enhance dialogue to be more expressive
function enhanceDialogue(text, panelIndex) {
    if (!text || text.trim() === "") return "";
    
    const originalText = text;
    
    // Check if dialogue is already expressive with punctuation
    const hasExclamation = text.includes('!');
    const hasQuestion = text.includes('?');
    const hasEllipsis = text.includes('...');
    
    // Skip enhancement if already expressive
    if (hasExclamation && (hasQuestion || hasEllipsis)) {
        return originalText;
    }
    
    // Add appropriate punctuation based on dialogue content and panel position
    if (panelIndex === 0) {
        // First panel - often introducing or setting up
        if (!hasExclamation && !hasQuestion && text.length > 5 && 
            !text.endsWith('!') && !text.endsWith('?') && !text.endsWith('...')) {
            if (text.match(/what|how|why|where|when|who|is |are /i)) {
                text = text.replace(/\.$/g, '?');
            } else if (text.match(/wow|amazing|look|hey|oh|great|awesome|cool/i)) {
                text = text.replace(/\.$/g, '!');
            }
        }
    } else if (panelIndex === 3) {
        // Last panel - often conclusion or punchline
        if (!text.endsWith('!') && !text.endsWith('?') && !text.endsWith('...')) {
            // For punchlines or concluding statements
            if (text.match(/finally|at last|now|then|so|therefore|that's why|because/i)) {
                text = text.replace(/\.$/g, '!');
            }
        }
    } else {
        // Middle panels - often action/reaction 
        if (!text.endsWith('!') && !text.endsWith('?') && !text.endsWith('...')) {
            if (text.match(/oh no|wait|stop|look|run|hurry|quick|watch out/i)) {
                text = text.replace(/\.$/g, '!');
            } else if (text.match(/maybe|perhaps|i wonder|i think|not sure/i)) {
                text = text.replace(/\.$/g, '...');
            }
        }
    }
    
    // Add emphasis to key words if text doesn't already have formatting
    if (!text.includes('*') && !text.includes('_')) {
        // Find important words to emphasize
        const emphasisWords = ['never', 'always', 'everyone', 'nobody', 'everything', 'nothing', 
                             'everywhere', 'absolutely', 'definitely', 'totally', 'completely',
                             'must', 'need', 'have to', 'impossible', 'incredible'];
        
        for (const word of emphasisWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (text.match(regex)) {
                // Only emphasize once to avoid over-formatting
                text = text.replace(regex, (match) => match.toUpperCase());
                break;
            }
        }
    }
    
    return text;
}

// Function to determine dialogue style from content
function determineDialogueStyle(text) {
    if (!text) return "neutral";
    
    // Check for shouting or excitement
    if (text.match(/!{2,}/) || text.match(/[A-Z]{3,}/) || 
       (text.includes('!') && text.match(/wow|amazing|awesome|great|yes|no|stop|wait|look|run|hurry|oh no/i))) {
        return "excited";
    }
    
    // Check for questioning or confusion
    if (text.match(/\?{2,}/) || text.match(/what\?|how\?|why\?|where\?|when\?|who\?/i)) {
        return "questioning";
    }
    
    // Check for sadness
    if (text.match(/unfortunately|sadly|sorry|regret|miss|lost|never again|too late/i)) {
        return "sad";
    }
    
    // Check for whispering
    if (text.match(/psst|whisper|quietly|softly|between you and me|secret|don't tell/i) || 
        text.startsWith('*') && text.endsWith('*')) {
        return "whispering";
    }
    
    // Check for thinking
    if (text.match(/think|thought|wonder|hmm|ponder|consider/i) || 
        text.startsWith('(') && text.endsWith(')') || 
        text.includes('...')) {
        return "thinking";
    }
    
    // Check for sarcasm
    if (text.match(/yeah right|sure thing|of course not|as if|oh really|how nice/i)) {
        return "sarcastic";
    }
    
    return "neutral";
}

// Function to create and display the comic strip in the UI
function createComicStrip(originalScenario, structuredScenario, panelImages) {
    // Create comic strip container
    const stripContainer = document.createElement('div');
    stripContainer.className = 'comic-strip';
    
    // Add original scenario
    const scenarioDiv = document.createElement('div');
    scenarioDiv.className = 'comic-scenario';
    scenarioDiv.textContent = `Scenario: ${originalScenario}`;
    stripContainer.appendChild(scenarioDiv);
    
    // Add character descriptions if available
    if (structuredScenario.characters && Object.keys(structuredScenario.characters).length > 0) {
        const charactersDiv = document.createElement('div');
        charactersDiv.className = 'comic-characters';
        
        const charactersTitle = document.createElement('h3');
        charactersTitle.textContent = 'Characters:';
        charactersDiv.appendChild(charactersTitle);
        
        const charactersList = document.createElement('ul');
        Object.entries(structuredScenario.characters).forEach(([name, description]) => {
            const characterItem = document.createElement('li');
            let descriptionText = description;
            
            // Handle both string and object descriptions
            if (typeof description === 'object') {
                const details = [];
                if (description.appearance) details.push(description.appearance);
                if (description.clothing) details.push(`wearing ${description.clothing}`);
                if (description.personality) details.push(`personality: ${description.personality}`);
                descriptionText = details.join(', ');
            }
            
            characterItem.innerHTML = `<strong>${name}:</strong> ${descriptionText}`;
            charactersList.appendChild(characterItem);
        });
        
        charactersDiv.appendChild(charactersList);
        stripContainer.appendChild(charactersDiv);
    }
    
    // Create panels container
    const panelsContainer = document.createElement('div');
    panelsContainer.className = 'comic-panels';
    
    // Organize panels into rows of 2
    for (let i = 0; i < structuredScenario.panels.length; i += 2) {
        // Create a new row
        const panelRow = document.createElement('div');
        panelRow.className = 'panel-row';
        
        // Add panels to this row (up to 2)
        for (let j = i; j < Math.min(i + 2, structuredScenario.panels.length); j++) {
            const panel = structuredScenario.panels[j];
            
            const panelDiv = document.createElement('div');
            panelDiv.className = 'panel';
            
            // Add panel image
            const img = document.createElement('img');
            img.src = panelImages[j];
            img.alt = `Panel ${j + 1}: ${panel.scene_description || ''}`;
            img.loading = 'lazy'; // Lazy load images
            img.onerror = () => {
                // If image fails to load, replace with placeholder
                img.src = `https://via.placeholder.com/512x512?text=Panel+${j+1}`;
            };
            panelDiv.appendChild(img);
            
            // Add dialogue bubbles if present
            if (panel.dialogue && panel.dialogue.text && panel.dialogue.text.trim() !== '') {
                let dialogueText, dialoguePosition, speakingCharacter, dialogueStyle;
                
                if (typeof panel.dialogue === 'string') {
                    dialogueText = panel.dialogue;
                    dialoguePosition = 'bottom-center';
                    speakingCharacter = '';
                    dialogueStyle = '';
                } else {
                    dialogueText = panel.dialogue.text;
                    dialoguePosition = panel.dialogue.position || 'bottom-center';
                    speakingCharacter = panel.dialogue.character || '';
                    dialogueStyle = panel.dialogue.style || '';
                }
                
                if (dialogueText && dialogueText.trim() !== '') {
                    const bubble = document.createElement('div');
                    bubble.className = 'speech-bubble';
                    
                    // Add styling based on dialogue style if available
                    if (dialogueStyle) {
                        switch(dialogueStyle.toLowerCase()) {
                            case 'excited':
                            case 'shouting':
                            case 'yelling':
                                bubble.style.fontWeight = 'bold';
                                bubble.style.fontSize = '15px';
                                bubble.style.textTransform = 'uppercase';
                                break;
                            case 'whispering':
                            case 'quiet':
                                bubble.style.fontStyle = 'italic';
                                bubble.style.opacity = '0.9';
                                bubble.style.fontSize = '13px';
                                break;
                            case 'thinking':
                            case 'thought':
                                bubble.classList.add('thought-bubble');
                                bubble.style.fontStyle = 'italic';
                                break;
                            case 'sad':
                            case 'depressed':
                                bubble.style.fontStyle = 'italic';
                                bubble.style.opacity = '0.85';
                                break;
                            case 'sarcastic':
                                bubble.style.fontStyle = 'italic';
                                break;
                        }
                    }
                    
                    // Add character name if provided
                    if (speakingCharacter && speakingCharacter.trim() !== '') {
                        const characterNameSpan = document.createElement('span');
                        characterNameSpan.className = 'speaking-character';
                        characterNameSpan.textContent = speakingCharacter + ': ';
                        bubble.appendChild(characterNameSpan);
                    }
                    
                    // Add dialogue text
                    const dialogueTextSpan = document.createElement('span');
                    dialogueTextSpan.textContent = dialogueText;
                    bubble.appendChild(dialogueTextSpan);
                    
                    // Set bubble position
                    switch(dialoguePosition) {
                        case 'top-left':
                            bubble.style.top = '10px';
                            bubble.style.left = '10px';
                            bubble.style.textAlign = 'left';
                            break;
                        case 'top-center':
                            bubble.style.top = '10px';
                            bubble.style.left = '50%';
                            bubble.style.transform = 'translateX(-50%)';
                            bubble.style.textAlign = 'center';
                            break;
                        case 'top-right':
                            bubble.style.top = '10px';
                            bubble.style.right = '10px';
                            bubble.style.textAlign = 'right';
                            break;
                        case 'bottom-left':
                            bubble.style.bottom = '10px';
                            bubble.style.left = '10px';
                            bubble.style.textAlign = 'left';
                            break;
                        case 'bottom-right':
                            bubble.style.bottom = '10px';
                            bubble.style.right = '10px';
                            bubble.style.textAlign = 'right';
                            break;
                        default: // bottom-center
                            bubble.style.bottom = '10px';
                            bubble.style.left = '50%';
                            bubble.style.transform = 'translateX(-50%)';
                            bubble.style.textAlign = 'center';
                    }
                    
                    panelDiv.appendChild(bubble);
                }
            }
            
            panelRow.appendChild(panelDiv);
        }
        
        panelsContainer.appendChild(panelRow);
    }
    
    stripContainer.appendChild(panelsContainer);
    
    // Add action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'comic-actions';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-btn';
    downloadBtn.textContent = 'Download';
    downloadBtn.addEventListener('click', () => downloadComic(stripContainer, originalScenario));
    
    // Edit dialogues button
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.textContent = 'Edit Dialogues';
    editBtn.addEventListener('click', () => editDialogues(stripContainer, structuredScenario));
    
    // Add regenerate button
    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'action-btn';
    regenerateBtn.textContent = 'Regenerate';
    regenerateBtn.addEventListener('click', () => {
        scenarioInput.value = originalScenario;
        generateComic();
    });
    
    actionsDiv.appendChild(regenerateBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(downloadBtn);
    
    stripContainer.appendChild(actionsDiv);
    
    // Add to history (prepend to show newest first)
    comicHistory.prepend(stripContainer);
    
    // Scroll to top
    comicHistory.scrollTop = 0;
}

// Function to download the comic as an image
async function downloadComic(stripContainer, scenario) {
    try {
        // Show loading overlay
        toggleLoadingOverlay(true);
        
        // Hide the action buttons temporarily
        const actionsDiv = stripContainer.querySelector('.comic-actions');
        actionsDiv.style.display = 'none';
        
        // Use html2canvas to capture the comic strip
        if (typeof html2canvas === 'undefined') {
            // If html2canvas is not loaded, load it dynamically
            await loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
        }
        
        const canvas = await html2canvas(stripContainer);
        actionsDiv.style.display = 'flex'; // Restore buttons
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'comic-' + new Date().getTime() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error downloading comic:', error);
        alert('Failed to download comic: ' + error.message);
    } finally {
        // Hide loading overlay
        toggleLoadingOverlay(false);
    }
}

// Function to load external scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Function to edit dialogues
function editDialogues(stripContainer, structuredScenario) {
    const panels = stripContainer.querySelectorAll('.panel');
    
    panels.forEach((panel, index) => {
        const bubble = panel.querySelector('.speech-bubble');
        if (bubble) {
            const currentText = bubble.textContent;
            const newText = prompt(`Edit dialogue for panel ${index + 1}:`, currentText);
            
            if (newText !== null && newText !== currentText) {
                bubble.textContent = newText;
                
                // Update the structured scenario object too
                if (typeof structuredScenario.panels[index].dialogue === 'string') {
                    structuredScenario.panels[index].dialogue = newText;
                } else {
                    structuredScenario.panels[index].dialogue.text = newText;
                }
            }
        } else {
            // No dialogue exists, ask if user wants to add one
            const addNew = confirm(`No dialogue in panel ${index + 1}. Add one?`);
            if (addNew) {
                const newText = prompt(`Enter dialogue for panel ${index + 1}:`);
                if (newText) {
                    const bubble = document.createElement('div');
                    bubble.className = 'speech-bubble';
                    bubble.textContent = newText;
                    bubble.style.bottom = '10px';
                    bubble.style.left = '50%';
                    bubble.style.transform = 'translateX(-50%)';
                    panel.appendChild(bubble);
                    
                    // Update the structured scenario
                    structuredScenario.panels[index].dialogue = {
                        text: newText,
                        position: "bottom-center"
                    };
                }
            }
        }
    });
}

// Generate a fallback scenario if LLM fails
function generateFallbackScenario(scenario) {
    // Split the scenario into approximately three parts
    const words = scenario.split(' ');
    const wordsPerPanel = Math.ceil(words.length / 3);
    
    const panels = [];
    
    for (let i = 0; i < 3; i++) {
        const start = i * wordsPerPanel;
        const end = Math.min(start + wordsPerPanel, words.length);
        const panelText = words.slice(start, end).join(' ');
        
        panels.push({
            scene_description: panelText,
            character_positions: {
                character: "center"
            },
            dialogue: {
                text: i === 1 ? panelText : "",
                position: "bottom-center"
            }
        });
    }
    
    return panels;
}

// Direct text generation without API for scenarios where Gemini API might fail
function generateDirectScenario(scenario) {
    console.log("Using direct text generation for scenario:", scenario);
    
    // Get important words from the scenario
    const words = scenario.toLowerCase().split(/\s+/);
    
    // Filter out common words
    const commonWords = ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about", "like", "is", "are", "was", "were"];
    const keyWords = words.filter(word => !commonWords.includes(word) && word.length > 2);
    
    // Extract subjects, locations, and actions from the scenario
    let subjects = [];
    let locations = [];
    let actions = [];
    
    // Simple extraction based on common patterns
    if (scenario.includes(" in ")) {
        const parts = scenario.split(" in ");
        subjects = parts[0].split(" and ");
        locations = parts[1].split(" and ");
    } else {
        subjects = [scenario.split(" ")[0]];
    }
    
    // Get verbs (simplistic approach)
    const possibleVerbs = words.filter(word => 
        word.endsWith("ing") || 
        word.endsWith("ed") || 
        ["make", "build", "find", "search", "talk", "run", "jump", "eat", "drink", "teach", "learn"].includes(word)
    );
    
    if (possibleVerbs.length > 0) {
        actions = possibleVerbs.slice(0, 2);
    }
    
    // Create character descriptions
    const characters = {};
    subjects.forEach(subject => {
        // Generate random character description
        const hairColors = ["black", "brown", "blonde", "red", "grey", "white"];
        const eyeColors = ["blue", "green", "brown", "hazel", "grey"];
        const bodyTypes = ["tall", "short", "average height", "slim", "muscular", "heavyset"];
        const clothingStyles = ["casual", "formal", "sporty", "colorful", "minimalist", "eccentric"];
        
        characters[subject] = `${bodyTypes[Math.floor(Math.random() * bodyTypes.length)]} with ${hairColors[Math.floor(Math.random() * hairColors.length)]} hair and ${eyeColors[Math.floor(Math.random() * eyeColors.length)]} eyes, wearing ${clothingStyles[Math.floor(Math.random() * clothingStyles.length)]} clothes`;
    });
    
    // Create 3-4 panels with progressive storytelling
    const numPanels = Math.floor(Math.random() * 2) + 3; // 3-4 panels
    const panels = [];
    
    // First panel: Introduction
    panels.push({
        scene_description: `${subjects[0]} preparing for ${actions[0] || "action"}`,
        character_positions: { [subjects[0]]: "center" },
        character_expressions: { [subjects[0]]: "excited" },
        dialogue: { 
            text: `I'm going to ${actions[0] || "do something"} ${locations[0] ? "in the " + locations[0] : ""}!`, 
            position: "top-right" 
        }
    });
    
    // Middle panels
    for (let i = 1; i < numPanels - 1; i++) {
        panels.push({
            scene_description: `${subjects[0]} ${actions[0] || "doing something"} ${locations[0] ? "in the " + locations[0] : ""}`,
            character_positions: { [subjects[0]]: i % 2 === 0 ? "left" : "right" },
            character_expressions: { [subjects[0]]: ["focused", "surprised", "confused", "determined"][i % 4] },
            dialogue: { 
                text: `This is ${["fun", "challenging", "interesting", "exciting"][Math.floor(Math.random() * 4)]}!`, 
                position: "bottom-center" 
            }
        });
    }
    
    // Final panel: Conclusion
    panels.push({
        scene_description: `${subjects[0]} ${["happy", "satisfied", "excited", "tired"][Math.floor(Math.random() * 4)]} after ${actions[0] || "the activity"}`,
        character_positions: { [subjects[0]]: "center" },
        character_expressions: { [subjects[0]]: "smiling" },
        dialogue: { 
            text: `That was ${["great", "awesome", "fantastic", "incredible"][Math.floor(Math.random() * 4)]}!`, 
            position: "bottom-right" 
        }
    });
    
    return {
        characters: characters,
        panels: panels
    };
}

// Function to generate a random scenario
function generateRandomScenario() {
    // Add a small animation to the dice button
    randomScenarioBtn.classList.add('spinning');
    
    // Get random scenario
    const randomIndex = Math.floor(Math.random() * RANDOM_SCENARIOS.length);
    const randomScenario = RANDOM_SCENARIOS[randomIndex];
    
    // Animate typing effect for better user experience
    const typingSpeed = 25; // milliseconds per character
    scenarioInput.value = ""; // Clear the input
    
    // Add characters one by one to simulate typing
    let charIndex = 0;
    const typeNextChar = () => {
        if (charIndex < randomScenario.length) {
            scenarioInput.value += randomScenario.charAt(charIndex);
            charIndex++;
            setTimeout(typeNextChar, typingSpeed);
        } else {
            // Animation complete
            randomScenarioBtn.classList.remove('spinning');
            
            // Focus the input and scroll to the end
            scenarioInput.focus();
            scenarioInput.scrollTop = scenarioInput.scrollHeight;
        }
    };
    
    // Start typing animation with a small delay
    setTimeout(typeNextChar, 300);
} 