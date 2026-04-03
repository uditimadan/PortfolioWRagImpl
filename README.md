# PortfolioWRagImpl
My Personal Portfolio developed with a special Retrieval-Augmented Generation (RAG) system chatbot.


My system:

* allow users to upload documents to the system;
* store documents in MongoDB and prepare them for retrieval (chunking/processing);
* support multiple retrieval methods (Semantic vs TF-IDF) selected in the dropdown;
* retrieve top relevant text chunks for each user prompt and pass them into the OpenAI prompt (RAG);
* display retrieved evidence (with relevance scores) in the interface; and
* compute and display confidence metrics based on retrieved evidence.

<img width="1298" height="675" alt="Screenshot 2026-03-23 at 11 41 22 PM" src="https://github.com/user-attachments/assets/2d8579dd-3f27-426f-bdef-77e4c4b2a978" />
<img width="1240" height="622" alt="Screenshot 2026-03-23 at 11 22 23 PM" src="https://github.com/user-attachments/assets/b071bce2-cd4e-460d-b431-d70848c9bba2" />
