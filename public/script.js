// Initing Vars
const skills = ["HTML", "CSS", "JavaScript"];

// TODO: require multer
// TODO: require the Document model
// TODO: require the provided documentProcessor service

// TODO: configure multer with a destination folder such as "uploads/" so documentProcessor.js can read the uploaded file

// Change header color when clicked
const headerTitle = document.querySelector("header h1");
if (headerTitle) {
    headerTitle.addEventListener("click", function () {
        this.style.color = "#ffb6c1";
    });
}

// Greet User Func
function greetUser(name) {
    const greetingParagraph = document.getElementById("greeting");
    if (greetingParagraph) {
        greetingParagraph.textContent = `Hello, ${name}! 👋`;}
}

// Conditional Checking Age Func
function checkAge(age) {
    if (age < 5) {
        console.log("You’re too young to take this quiz.");} 
        else {
        console.log("Welcome to the quiz!");}
}

// Skills Function
function displaySkills() {
    const skillsParagraph = document.getElementById("skills-list");
    if (!skillsParagraph) return;
    let skillText = "Your skills include: ";
    for (let i = 0; i < skills.length; i++) {
        skillText += skills[i];
        if (i < skills.length - 1) {
            skillText += ", ";}}
    skillsParagraph.textContent = skillText;
}

// Quiz start function
function startQuiz() {
    const nameInput = document.getElementById("username")?.value;
    const ageInput = document.getElementById("age")?.value;
    const ageNumber = Number(ageInput);

    greetUser(nameInput);
    checkAge(ageNumber);
    displaySkills();
}

// Button event (only if button exists)
const quizButton = document.getElementById("start-quiz");
if (quizButton) {
    quizButton.addEventListener("click", startQuiz);
}

// AI Chatbot contact with RAG
const chatForm = document.getElementById("chat-form");
if (chatForm) {
    chatForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("message").value;
        const retrievalMethod = document.getElementById("retrieval-method").value;

        // Show loading
        const responseDiv = document.getElementById("response");
        responseDiv.textContent = "Processing...";

        try {
            const response = await fetch("/submit-prompt", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: message,
                    retrievalMethod: retrievalMethod
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Display bot response
            responseDiv.innerHTML = `<h3>AI Response:</h3><p>${data.botResponse}</p>`;

            // Display RAG results if available
            displayRAGResults(data.retrievedDocuments, data.confidenceMetrics);

        } catch (error) {
            console.error("Error:", error);
            responseDiv.textContent = "Error contacting chatbot: " + error.message;
        }
    });
}

// Function to display RAG results
function displayRAGResults(retrievedDocuments, confidenceMetrics) {
    const ragResultsDiv = document.getElementById("rag-results");
    const retrievedDocsDiv = document.getElementById("retrieved-documents");
    const confidenceDiv = document.getElementById("confidence-metrics");

    // Show retrieved documents
    if (retrievedDocuments && retrievedDocuments.length > 0) {
        ragResultsDiv.style.display = "block";

        let docsHtml = "<ul>";
        retrievedDocuments.forEach((doc, index) => {
            docsHtml += `
                <li style="margin-bottom: 15px; border: 1px solid #ddd; padding: 10px;">
                    <strong>Document:</strong> ${doc.docName}<br>
                    <strong>Chunk #:</strong> ${doc.chunkIndex}<br>
                    <strong>Relevance Score:</strong> ${doc.relevanceScore ? doc.relevanceScore.toFixed(3) : 'N/A'}<br>
                    <strong>Text:</strong> ${doc.chunkText}
                </li>
            `;
        });
        docsHtml += "</ul>";
        retrievedDocsDiv.innerHTML = docsHtml;

        // Show confidence metrics
        if (confidenceMetrics) {
            confidenceDiv.innerHTML = `
                <div style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
                    <strong>Retrieval Method:</strong> ${confidenceMetrics.retrievalMethod}<br>
                    <strong>Overall Confidence:</strong> ${(confidenceMetrics.overallConfidence * 100).toFixed(1)}%<br>
                    <strong>Retrieval Confidence:</strong> ${(confidenceMetrics.retrievalConfidence * 100).toFixed(1)}%<br>
                    ${confidenceMetrics.responseConfidence !== null ?
                        `<strong>Response Confidence:</strong> ${(confidenceMetrics.responseConfidence * 100).toFixed(1)}%` :
                        '<strong>Response Confidence:</strong> Not available'
                    }
                </div>
            `;
        }
    } else {
        ragResultsDiv.style.display = "none";
    }
}

// For MongoDB
// Log click events on the "Submit" button
document.getElementById('submit').addEventListener('click', () => {
    logEvent('click', 'Send Button');
    });
    // Log hover and focus events on the input field
    document.getElementById('message').addEventListener('mouseover', () => {
    logEvent('hover', 'User Input');
    });
    document.getElementById('message').addEventListener('focus', () => {
    logEvent('focus', 'User Input');
    });
    // Function to log events to the server
    function logEvent(type, element) {
    fetch('/log-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: type, elementName: element, timestamp: new Date() })
    });
    }

// Document upload functionality
document.getElementById("upload-btn").addEventListener("click", async () => {
    const fileInput = document.getElementById("document-upload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please choose a file first.");
        return;
    }

    const uploadBtn = document.getElementById("upload-btn");
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = "Uploading...";
    uploadBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append("document", file);

        const response = await fetch("/upload-document", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.status === "success") {
            alert(`Document uploaded successfully! Processed ${data.chunkCount} chunks.`);
            fileInput.value = ""; // Clear the file input
            loadDocuments(); // Refresh the document list
        } else {
            alert("Upload failed: " + (data.error || "Unknown error"));
        }

    } catch (error) {
        console.error("Upload error:", error);
        alert("Upload failed: " + error.message);
    } finally {
        uploadBtn.textContent = originalText;
        uploadBtn.disabled = false;
    }
});

  async function loadDocuments() {
    const response = await fetch("/documents");
    const docs = await response.json();
  
    const documentsList = document.getElementById("documents-list");
    documentsList.innerHTML = "";
  
    // loop through docs
    docs.forEach(doc => {
      // create a list item
      const listItem = document.createElement("li");
      // display the filename and processing status
      listItem.textContent = `${doc.filename} - Status: ${doc.processingStatus}`;
      // append it to documentsList
      documentsList.appendChild(listItem);
    });
  }

// Load documents when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadDocuments();
});