# PortfolioWRagImpl
My Personal Portfolio developed with a special Retrieval-Augmented Generation (RAG) system chatbot.


My system:

* allow users to upload documents to the system;
* store documents in MongoDB and prepare them for retrieval (chunking/processing);
* support multiple retrieval methods (Semantic vs TF-IDF) selected in the dropdown;
* retrieve top relevant text chunks for each user prompt and pass them into the OpenAI prompt (RAG);
* display retrieved evidence (with relevance scores) in the interface; and
* compute and display confidence metrics based on retrieved evidence.

# MongoDB Atlas Connection

Document collection
<img width="628" height="387" alt="Screenshot 2026-04-02 at 5 32 16 PM" src="https://github.com/user-attachments/assets/648d29a6-b76a-445e-8c95-98587df69e14" />

Interaction collection with retrieved evidence + confidenceMetrics fields visible
<img width="763" height="409" alt="Screenshot 2026-04-02 at 5 46 20 PM" src="https://github.com/user-attachments/assets/a8dca98f-cc30-45cb-a1df-8a9d06245fac" />
