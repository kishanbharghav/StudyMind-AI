from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def process_pdf_text(text: str, session_id: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(text)
    
    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )
    vectorstore.add_texts(chunks)
    return len(chunks)

def retrieve_context(question: str, session_id: str, k=5) -> list[str]:
    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )
    results = vectorstore.similarity_search(question, k=k)
    return [doc.page_content for doc in results]

def retrieve_all_context(session_id: str) -> str:
    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )
    results = vectorstore.get()
    docs = results.get("documents", [])
    full_text = "\n\n".join(docs)
    return full_text[:12000]
