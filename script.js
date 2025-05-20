// MedicaAI Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatMessages = document.getElementById('chatMessages');
    const symptomInput = document.getElementById('symptomInput');
    const sendButton = document.getElementById('sendButton');
    const clearChatButton = document.getElementById('clearChat');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const autocompleteContainer = document.getElementById('autocompleteContainer');
    const themeToggleButton = document.getElementById('theme-toggle'); //
    const bodyElement = document.body;
    
    // Templates
    const userMessageTemplate = document.getElementById('userMessageTemplate');
    const aiMessageTemplate = document.getElementById('aiMessageTemplate');
    const predictionMessageTemplate = document.getElementById('predictionMessageTemplate');
    // Assuming you have a unifiedAiResponseTemplate in your HTML
    const unifiedAiResponseTemplate = document.getElementById('unifiedAiResponseTemplate'); 
    
    // Store all available symptoms for autocomplete
    let availableSymptoms = [];
    
    // Fetch symptoms from backend when page loads
    fetchSymptoms();
    
    // Event listeners
    sendButton.addEventListener('click', handleSendMessage);
    symptomInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    clearChatButton.addEventListener('click', clearChat);
    symptomInput.addEventListener('input', handleSymptomInput);
    symptomInput.addEventListener('focus', function() {
        if (symptomInput.value.trim() && availableSymptoms.length > 0) {
            showAutocompleteSuggestions();
        }
    });
    document.addEventListener('click', function(e) {
        // Close autocomplete when clicking outside
        if (e.target !== autocompleteContainer && e.target !== symptomInput) {
            autocompleteContainer.style.display = 'none';
        }
    });
    themeToggleButton.addEventListener('click', toggleTheme); //
    
    // Initialize theme
    initializeTheme();

    /**
     * Toggle dark/light theme
     */
    function toggleTheme() {
        bodyElement.classList.toggle('dark-mode');
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        updateThemeButtonIcon(isDarkMode);
    }

    /**
     * Initialize theme based on localStorage or system preference
     */
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            bodyElement.classList.add('dark-mode');
            updateThemeButtonIcon(true);
        } else {
            bodyElement.classList.remove('dark-mode');
            updateThemeButtonIcon(false);
        }
    }

    /**
     * Update theme toggle button icon
     */
    function updateThemeButtonIcon(isDarkMode) {
        const icon = themeToggleButton.querySelector('i'); //
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            themeToggleButton.setAttribute('aria-label', 'Switch to light mode');
            themeToggleButton.title = 'Switch to light mode';
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            themeToggleButton.setAttribute('aria-label', 'Switch to dark mode');
            themeToggleButton.title = 'Switch to dark mode';
        }
    }
    
    /**
     * Handle sending a message
     */
    function handleSendMessage() {
        const symptoms = symptomInput.value.trim();
        if (!symptoms) return;
        
        addUserMessage(symptoms);
        symptomInput.value = '';
        autocompleteContainer.style.display = 'none';
        loadingOverlay.style.display = 'flex';
        sendPredictionRequest(symptoms);
    }
    
    /**
     * Send prediction request to backend API
     */
    function sendPredictionRequest(symptoms) {
        fetch('/api/predict', { // Assuming this is your backend endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symptoms }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            loadingOverlay.style.display = 'none';
            if (data.status === 'success' && data.messages) {
                // Use the new unified response structure if available
                if (data.is_unified_response) {
                     addUnifiedAIMessage(data.messages);
                } else {
                    // Fallback to old processing if needed, or adapt as necessary
                    processCompactResponse(data.messages); 
                }
            } else {
                addAIMessage(`Error: ${data.error || 'Something went wrong. Please try again.'}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingOverlay.style.display = 'none';
            addAIMessage(`Sorry, there was an error: ${error.message}. Please check the console and try again.`);
        });
    }

    /**
     * Add a unified AI response message to the chat using the template
     */
    function addUnifiedAIMessage(responseData) {
        if (!unifiedAiResponseTemplate) {
            console.error('unifiedAiResponseTemplate not found');
            // Fallback to simpler message if template is missing
            addAIMessage("Received complex data, but couldn't display it fully.");
            return;
        }
        const clone = document.importNode(unifiedAiResponseTemplate.content, true);

        // Populate based on expected responseData structure
        const diseasePrediction = responseData.find(m => m.type === 'prediction');
        if (diseasePrediction) {
            clone.querySelector('.disease-name').textContent = diseasePrediction.disease || 'N/A';
            clone.querySelector('.probability').textContent = diseasePrediction.probability ? `${(parseFloat(diseasePrediction.probability) * 100).toFixed(1)}% Confidence` : 'Probability N/A';
        }

        const description = responseData.find(m => m.type === 'description');
        if (description) {
            clone.querySelector('.description').textContent = description.content || 'No description available.';
        } else {
            clone.querySelector('#diseaseDescription').style.display = 'none';
        }

        const commonSymptoms = responseData.find(m => m.type === 'symptoms_list'); // Assuming type 'symptoms_list' for list format
        if (commonSymptoms && Array.isArray(commonSymptoms.content)) {
            const symptomsListEl = clone.querySelector('.symptoms-list');
            symptomsListEl.innerHTML = ''; // Clear previous
            commonSymptoms.content.forEach(symptom => {
                const li = document.createElement('li');
                li.textContent = symptom;
                symptomsListEl.appendChild(li);
            });
        } else {
           clone.querySelector('#commonSymptoms').style.display = 'none';
        }
        
        const recommendations = responseData.find(m => m.type === 'recommendations');
        if (recommendations && Array.isArray(recommendations.content)) {
            const recommendationsListEl = clone.querySelector('.recommendations-list');
            recommendationsListEl.innerHTML = ''; // Clear previous
            recommendations.content.forEach(rec => {
                const li = document.createElement('li');
                li.textContent = rec;
                recommendationsListEl.appendChild(li);
            });
        } else {
            clone.querySelector('#recommendations').style.display = 'none';
        }

        // Handle other sections similarly
        const precautions = responseData.find(m => m.type === 'precautions');
        if (precautions) {
             const el = clone.querySelector('.precautions-list');
             if (el) el.innerHTML = formatListContent(precautions.content); else console.warn("Precautions list element not found");
        } else {
            const section = clone.querySelector('#precautions');
            if (section) section.style.display = 'none';
        }

        const alternatives = responseData.find(m => m.type === 'alternatives');
        if (alternatives) {
             const el = clone.querySelector('.alternative-diagnoses-list');
             if (el) el.innerHTML = formatListContent(alternatives.content); else console.warn("Alternatives list element not found");
        } else {
            const section = clone.querySelector('#alternativeDiagnoses');
            if (section) section.style.display = 'none';
        }
        
        const relatedSymptoms = responseData.find(m => m.type === 'related_symptoms'); // if this is the type from backend
        if (relatedSymptoms) {
             const el = clone.querySelector('.related-symptoms-list');
             if (el) el.innerHTML = formatListContent(relatedSymptoms.content); else console.warn("Related symptoms list element not found");
        } else {
             const section = clone.querySelector('#relatedSymptoms');
             if (section) section.style.display = 'none';
        }

        clone.querySelector('.message-time').textContent = getCurrentTime();
        chatMessages.appendChild(clone);
        scrollToBottom();
    }

    function formatListContent(content) {
        if (Array.isArray(content)) {
            return `<ul>${content.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }
        // If content is a string with newlines or comma-separated, try to format
        if (typeof content === 'string') {
            const items = content.split(/\n|,/g).map(item => item.trim()).filter(item => item);
            if (items.length > 1) {
                return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            }
        }
        return `<p>${content || 'No information available for this section.'}</p>`;
    }
    
    /**
     * Process response messages from backend in a compact form (Legacy or fallback)
     */
    function processCompactResponse(messages) { //
        if (!messages || messages.length === 0) { //
            addAIMessage('No results were returned. Please try different symptoms.'); //
            return; //
        }
        
        let compactContent = ''; //
        let predictionData = null; //
        
        messages.forEach(message => { //
            if (message.type === 'prediction') { //
                predictionData = message; //
            } else {
                let title = ''; //
                let content = message.content || 'No content available'; //
                
                if (message.type === 'precautions') { //
                    title = 'Precautions'; //
                    content = content.replace(/^(precautions|recommended precautions):?\s*/i, ''); //
                } else if (message.type === 'alternatives') { //
                    title = 'Alternative Diagnoses'; //
                    content = content.replace(/^alternative diagnoses:?\s*/i, ''); //
                    content = content.replace(/^other possible diseases:?\s*/i, ''); //
                } else if (message.type === 'symptoms') { //
                    title = 'Related Symptoms'; //
                    content = content.replace(/^related symptoms:?\s*/i, ''); //
                    content = content.replace(/^symptom severity:?\s*/i, ''); //
                }
                
                if (title) { //
                    compactContent += `<div class="info-section"><h4>${title}</h4><p>${content}</p></div>`; //
                } else { //
                    compactContent += `<div class="info-section"><p>${content}</p></div>`; //
                }
            }
        });
        
        if (predictionData) { //
            addCompactPredictionMessage(predictionData.disease, predictionData.probability, predictionData.description, compactContent); //
        } else if (compactContent) { //
            addFormattedAIMessage(compactContent); //
        }
    }
    
    /**
     * Add a user message to the chat
     */
    function addUserMessage(text) {
        const clone = document.importNode(userMessageTemplate.content, true); //
        clone.querySelector('.message-content p').textContent = text; //
        clone.querySelector('.message-time').textContent = getCurrentTime(); //
        chatMessages.appendChild(clone); //
        scrollToBottom(); //
    }
    
    /**
     * Add an AI message to the chat
     */
    function addAIMessage(text) {
        const clone = document.importNode(aiMessageTemplate.content, true); //
        const content = clone.querySelector('.message-content'); //
        text.split('\n').forEach(line => { //
            if (line.trim()) { //
                const p = document.createElement('p'); //
                p.textContent = line; //
                content.appendChild(p); //
            }
        });
        clone.querySelector('.message-time').textContent = getCurrentTime(); //
        chatMessages.appendChild(clone); //
        scrollToBottom(); //
    }
    
    /**
     * Add a formatted AI message with HTML content
     */
    function addFormattedAIMessage(htmlContent) {
        const clone = document.importNode(aiMessageTemplate.content, true); //
        const content = clone.querySelector('.message-content'); //
        content.innerHTML = htmlContent; //
        clone.querySelector('.message-time').textContent = getCurrentTime(); //
        chatMessages.appendChild(clone); //
        scrollToBottom(); //
    }
    
    /**
     * Add a compact prediction message with additional content
     */
    function addCompactPredictionMessage(disease, probability, description, additionalContent) {
        const clone = document.importNode(predictionMessageTemplate.content, true); //
        clone.querySelector('.disease-name').textContent = disease; //
        clone.querySelector('.probability').textContent = probability; //
        clone.querySelector('.description').textContent = description; //
        if (additionalContent) { //
            const additionalEl = document.createElement('div'); //
            additionalEl.className = 'additional-info'; //
            additionalEl.innerHTML = additionalContent; //
            clone.querySelector('.message-content').appendChild(additionalEl); //
        }
        clone.querySelector('.message-time').textContent = getCurrentTime(); //
        chatMessages.appendChild(clone); //
        scrollToBottom(); //
    }
    
    /**
     * Clear the chat history
     */
    function clearChat() {
        while (chatMessages.children.length > 1) { //
            chatMessages.removeChild(chatMessages.lastChild); //
        }
    }
    
    /**
     * Fetch available symptoms for autocomplete
     */
    function fetchSymptoms() {
        fetch('/api/symptoms') //
            .then(response => response.json()) //
            .then(data => {
                if (data.status === 'success' && data.symptoms) { //
                    availableSymptoms = data.symptoms; //
                }
            })
            .catch(error => {
                console.error('Error fetching symptoms:', error); //
            });
    }
    
    /**
     * Handle symptom input for autocomplete
     */
    function handleSymptomInput() {
        const input = symptomInput.value.trim(); //
        if (input && availableSymptoms.length > 0) { //
            showAutocompleteSuggestions(); //
        } else {
            autocompleteContainer.style.display = 'none'; //
        }
    }
    
    /**
     * Show autocomplete suggestions based on current input
     */
    function showAutocompleteSuggestions() {
        const input = symptomInput.value; //
        const lastCommaIndex = input.lastIndexOf(','); //
        const searchTerm = lastCommaIndex !== -1 ?  //
            input.substring(lastCommaIndex + 1).trim().toLowerCase() :  //
            input.trim().toLowerCase(); //
        
        if (!searchTerm) { //
            autocompleteContainer.style.display = 'none'; //
            return; //
        }
        
        const filteredSymptoms = availableSymptoms.filter(symptom =>  //
            symptom.toLowerCase().includes(searchTerm) //
        ).slice(0, 7); //
        
        if (filteredSymptoms.length > 0) { //
            displayAutocompleteSuggestions(filteredSymptoms, searchTerm, lastCommaIndex); //
        } else {
            autocompleteContainer.style.display = 'none'; //
        }
    }
    
    /**
     * Display autocomplete suggestions
     */
    function displayAutocompleteSuggestions(suggestions, searchTerm, lastCommaIndex) {
        autocompleteContainer.innerHTML = ''; //
        suggestions.forEach(symptom => { //
            const item = document.createElement('div'); //
            item.className = 'autocomplete-item'; //
            item.textContent = symptom; //
            item.addEventListener('click', function() { //
                if (lastCommaIndex !== -1) { //
                    symptomInput.value =  //
                        symptomInput.value.substring(0, lastCommaIndex + 1) + ' ' + symptom; //
                } else {
                    symptomInput.value = symptom; //
                }
                autocompleteContainer.style.display = 'none'; //
                symptomInput.focus(); //
            });
            autocompleteContainer.appendChild(item); //
        });
        autocompleteContainer.style.display = 'block'; //
    }
    
    /**
     * Get current time formatted for messages
     */
    function getCurrentTime() {
        const now = new Date(); //
        let hours = now.getHours(); //
        const minutes = now.getMinutes().toString().padStart(2, '0'); //
        const ampm = hours >= 12 ? 'PM' : 'AM'; //
        hours = hours % 12; //
        hours = hours ? hours : 12; //
        return `${hours}:${minutes} ${ampm}`; //
    }
    
    /**
     * Scroll chat to the bottom
     */
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight; //
    }
});