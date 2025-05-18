// MedicaAI Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatMessages = document.getElementById('chatMessages');
    const symptomInput = document.getElementById('symptomInput');
    const sendButton = document.getElementById('sendButton');
    const clearChatButton = document.getElementById('clearChat');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const autocompleteContainer = document.getElementById('autocompleteContainer');
    
    // Templates
    const userMessageTemplate = document.getElementById('userMessageTemplate');
    const aiMessageTemplate = document.getElementById('aiMessageTemplate');
    const predictionMessageTemplate = document.getElementById('predictionMessageTemplate');
    
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
    
    /**
     * Handle sending a message
     */
    function handleSendMessage() {
        const symptoms = symptomInput.value.trim();
        if (!symptoms) return;
        
        // Add user message to chat
        addUserMessage(symptoms);
        
        // Clear input
        symptomInput.value = '';
        autocompleteContainer.style.display = 'none';
        
        // Show loading indicator
        loadingOverlay.style.display = 'flex';
        
        // Send request to backend
        sendPredictionRequest(symptoms);
    }
    
    /**
     * Send prediction request to backend API
     */
    function sendPredictionRequest(symptoms) {
        fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symptoms }),
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            loadingOverlay.style.display = 'none';
            
            if (data.status === 'success') {
                // Process and display messages
                processResponseMessages(data.messages);
            } else {
                // Display error message
                addAIMessage(`Error: ${data.error || 'Something went wrong. Please try again.'}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingOverlay.style.display = 'none';
            addAIMessage('Sorry, there was an error processing your request. Please try again.');
        });
    }
    
    /**
     * Process response messages from backend
     */
    function processResponseMessages(messages) {
        if (!messages || messages.length === 0) {
            addAIMessage('No results were returned. Please try different symptoms.');
            return;
        }
        
        // Add each message with small delay for better UX
        messages.forEach((message, index) => {
            setTimeout(() => {
                displayMessage(message);
            }, index * 300);
        });
    }
    
    /**
     * Display a message based on its type
     */
    function displayMessage(message) {
        switch(message.type) {
            case 'prediction':
                addPredictionMessage(message.disease, message.probability, message.description);
                break;
            case 'precautions':
            case 'alternatives':
            case 'symptoms':
            case 'text':
            default:
                addAIMessage(message.content || 'No content available');
                break;
        }
    }
    
    /**
     * Add a user message to the chat
     */
    function addUserMessage(text) {
        const clone = document.importNode(userMessageTemplate.content, true);
        clone.querySelector('.message-content p').textContent = text;
        clone.querySelector('.message-time').textContent = getCurrentTime();
        
        // Add to chat and scroll to bottom
        chatMessages.appendChild(clone);
        scrollToBottom();
    }
    
    /**
     * Add an AI message to the chat
     */
    function addAIMessage(text) {
        const clone = document.importNode(aiMessageTemplate.content, true);
        
        // Handle newlines in the text
        const content = clone.querySelector('.message-content');
        text.split('\n').forEach(line => {
            if (line.trim()) {
                const p = document.createElement('p');
                p.textContent = line;
                content.appendChild(p);
            }
        });
        
        clone.querySelector('.message-time').textContent = getCurrentTime();
        
        // Add to chat and scroll to bottom
        chatMessages.appendChild(clone);
        scrollToBottom();
    }
    
    /**
     * Add a prediction message with special formatting
     */
    function addPredictionMessage(disease, probability, description) {
        const clone = document.importNode(predictionMessageTemplate.content, true);
        
        clone.querySelector('.disease-name').textContent = disease;
        clone.querySelector('.probability').textContent = probability;
        clone.querySelector('.description').textContent = description;
        clone.querySelector('.message-time').textContent = getCurrentTime();
        
        // Add to chat and scroll to bottom
        chatMessages.appendChild(clone);
        scrollToBottom();
    }
    
    /**
     * Clear the chat history
     */
    function clearChat() {
        // Remove all messages except the first welcome message
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
    }
    
    /**
     * Fetch available symptoms for autocomplete
     */
    function fetchSymptoms() {
        fetch('/api/symptoms')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.symptoms) {
                    availableSymptoms = data.symptoms;
                }
            })
            .catch(error => {
                console.error('Error fetching symptoms:', error);
            });
    }
    
    /**
     * Handle symptom input for autocomplete
     */
    function handleSymptomInput() {
        const input = symptomInput.value.trim();
        
        // If we have symptoms available and input, show suggestions
        if (input && availableSymptoms.length > 0) {
            showAutocompleteSuggestions();
        } else {
            autocompleteContainer.style.display = 'none';
        }
    }
    
    /**
     * Show autocomplete suggestions based on current input
     */
    function showAutocompleteSuggestions() {
        // Get the last part of the input after the last comma
        const input = symptomInput.value;
        const lastCommaIndex = input.lastIndexOf(',');
        const searchTerm = lastCommaIndex !== -1 ? 
            input.substring(lastCommaIndex + 1).trim().toLowerCase() : 
            input.trim().toLowerCase();
        
        // If the search term is empty, don't show suggestions
        if (!searchTerm) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // Filter symptoms based on search term
        const filteredSymptoms = availableSymptoms.filter(symptom => 
            symptom.toLowerCase().includes(searchTerm)
        ).slice(0, 7); // Limit to top 7 results
        
        // If we have matching symptoms, show them
        if (filteredSymptoms.length > 0) {
            displayAutocompleteSuggestions(filteredSymptoms, searchTerm, lastCommaIndex);
        } else {
            autocompleteContainer.style.display = 'none';
        }
    }
    
    /**
     * Display autocomplete suggestions
     */
    function displayAutocompleteSuggestions(suggestions, searchTerm, lastCommaIndex) {
        // Clear previous suggestions
        autocompleteContainer.innerHTML = '';
        
        // Create suggestion elements
        suggestions.forEach(symptom => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = symptom;
            
            // When suggestion is clicked, update input
            item.addEventListener('click', function() {
                if (lastCommaIndex !== -1) {
                    // If there was a comma, replace only the text after the comma
                    symptomInput.value = 
                        symptomInput.value.substring(0, lastCommaIndex + 1) + ' ' + symptom;
                } else {
                    // Otherwise replace the whole input
                    symptomInput.value = symptom;
                }
                
                // Hide suggestions and focus input
                autocompleteContainer.style.display = 'none';
                symptomInput.focus();
            });
            
            autocompleteContainer.appendChild(item);
        });
        
        // Show the suggestions
        autocompleteContainer.style.display = 'block';
    }
    
    /**
     * Get current time formatted for messages
     */
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    /**
     * Scroll chat to the bottom
     */
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
