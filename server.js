// Load environment variable
require('dotenv').config();
// Required packages
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');

// Services
const documentProcessor = require('./services/documentProcessor');
const embeddingService = require('./services/embeddingService');
const retrievalService = require('./services/retrievalService');
const confidenceCalculator = require('./services/confidenceCalculator');

// MongoDB
const mongoose = require('mongoose');

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'), false);
    }
  }
});

// Create Express app
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Models
const Interaction = require('./models/interaction');
const Document = require('./models/document');
const EventLog = require('./models/eventlog');

// Route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for contact/chat page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// POST route for AI contact chatbot with RAG
app.post('/submit-prompt', async (req, res) => {
  try {
    const { message, retrievalMethod = 'semantic' } = req.body;
    console.log("User Prompt:", message);
    console.log("Retrieval Method:", retrievalMethod);

    let retrievedDocuments = [];
    let confidenceMetrics = null;

    // Retrieve relevant documents
    if (message && message.trim()) {
      try {
        retrievedDocuments = await retrievalService.retrieve(message, {
          method: retrievalMethod,
          topK: 3,
          minScore: 0.3
        });
        console.log(`Retrieved ${retrievedDocuments.length} documents`);
      } catch (retrievalError) {
        console.error("Retrieval Error:", retrievalError);
      }
    }

    // Create context from retrieved documents
    let context = "";
    if (retrievedDocuments.length > 0) {
      context = "\n\nRelevant context from documents:\n" +
        retrievedDocuments.map((doc, index) =>
          `[${index + 1}] From "${doc.documentName}": ${doc.chunkText}`
        ).join("\n\n");
    }

    // Create the prompt with context
    const promptWithContext = retrievedDocuments.length > 0
      ? `${message}${context}\n\nPlease answer based on the provided context when relevant.`
      : message;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: promptWithContext }]
    });

    const botResponse = completion.choices[0].message.content;

    // Calculate confidence metrics
    confidenceMetrics = confidenceCalculator.calculate({
      retrievedDocs: retrievedDocuments,
      retrievalMethod,
      responseLogprobs: null
    });

    // Format retrieved documents for response
    const formattedRetrievedDocs = retrievedDocuments.map(doc => ({
      docName: doc.documentName,
      chunkIndex: doc.chunkIndex,
      chunkText: doc.chunkText.substring(0, 200) + '...', // Truncate for response
      relevanceScore: doc.relevanceScore || doc.score
    }));

    // Save interaction to MongoDB
    const interaction = new Interaction({
      userInput: message,
      botResponse: botResponse,
      retrievalMethod: retrievalMethod,
      retrievedDocuments: formattedRetrievedDocs,
      confidenceMetrics: confidenceMetrics
    });
    await interaction.save();

    res.json({
      botResponse: botResponse,
      retrievedDocuments: formattedRetrievedDocs,
      confidenceMetrics: confidenceMetrics
    });

  } catch (error) {
    console.error("Error in submit-prompt:", error);
    res.status(500).json({
      botResponse: "Something went wrong with the AI request.",
      retrievedDocuments: [],
      confidenceMetrics: null
    });
  }
});

// Event logging endpoint
app.post('/log-event', async (req, res) => {
  const { eventType, elementName, timestamp } = req.body;
  try {
    const event = new EventLog({ eventType, elementName, timestamp });
    await event.save();
    res.status(200).send('Event logged successfully');
  } catch (error) {
    console.error('Error logging event:', error.message);
    res.status(500).send('Server Error');
  }
});

// POST route for document upload
app.post("/upload-document", upload.single("document"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    console.log(`Processing document: ${req.file.originalname}`);

    // Process the document using documentProcessor service
    const processed = await documentProcessor.processDocument(req.file);
    console.log(`Document processed into ${processed.chunks.length} chunks`);

    // Generate embeddings for chunks
    console.log('Generating embeddings for chunks...');
    const chunksWithEmbeddings = await embeddingService.generateEmbeddings(processed.chunks);
    console.log(`Generated embeddings for ${chunksWithEmbeddings.length} chunks`);

    // Create and save Document in MongoDB with embeddings
    const document = new Document({
      filename: req.file.originalname,
      text: processed.fullText,
      chunks: chunksWithEmbeddings.map((chunk, index) => ({
        chunkIndex: index,
        text: chunk.text,
        embedding: chunk.embedding || []
      })),
      processingStatus: "ready"
    });

    await document.save();
    console.log(`Document saved to MongoDB: ${req.file.originalname}`);

    // Rebuild TF-IDF index to include new document
    console.log('Rebuilding TF-IDF index...');
    await retrievalService.rebuildIndex();
    console.log('TF-IDF index rebuilt');

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Could not delete uploaded file:', cleanupError.message);
    }

    res.json({
      status: "success",
      filename: req.file.originalname,
      chunkCount: processed.chunks.length,
      message: "Document uploaded and processed successfully"
    });

  } catch (error) {
    console.error("Error uploading document:", error.message);
    res.status(500).json({
      error: "Failed to process document",
      details: error.message
    });
  }
});

// GET route for documents list
app.get("/documents", async (req, res) => {
  try {
    const documents = await Document.find({})
      .select('_id filename processingStatus processedAt')
      .sort({ processedAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error.message);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Initialize and start server
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');

    // Initialize retrieval service
    console.log('Initializing retrieval service...');
    await retrievalService.initialize();
    console.log('Retrieval service initialized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });