const mongoose = require("mongoose");

// Creating a ChunkSchema
const ChunkSchema = new mongoose.Schema({
  chunkIndex: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  embedding: { 
    type: [Number], 
    default: [] }
  }, 
  { 
    _id: false 
});

// Creating the DocumentSchema
const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  chunks: [ChunkSchema],
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'error'],
    default: 'pending'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
});

const RetrievedDocumentSchema = new mongoose.Schema({
  docName: { type: String },
  chunkIndex: { type: Number },
  chunkText: { type: String },
  relevanceScore: { type: Number }
}, { _id: false });

const ConfidenceMetricsSchema = new mongoose.Schema({
  overallConfidence: { type: Number },
  retrievalConfidence: { type: Number },
  responseConfidence: { type: Number, default: null },
  retrievalMethod: { type: String }
}, { _id: false });

// Add these fields to your Interaction schema:

// retrievalMethod: { type: String },
// retrievedDocuments: { type: [RetrievedDocumentSchema], default: [] },
// confidenceMetrics: { type: ConfidenceMetricsSchema, default: null }

// Export the model
module.exports = mongoose.model("Document", DocumentSchema);
