# PortfolioWRagImpl
My Personal Portfolio developed with a special Retrieval-Augmented Generation (RAG) system chatbot.


My system:

* allow users to upload documents to the system;
* store documents in MongoDB and prepare them for retrieval (chunking/processing);
* support multiple retrieval methods (Semantic vs TF-IDF) selected in the dropdown;
* retrieve top relevant text chunks for each user prompt and pass them into the OpenAI prompt (RAG);
* display retrieved evidence (with relevance scores) in the interface; and
* compute and display confidence metrics based on retrieved evidence.
