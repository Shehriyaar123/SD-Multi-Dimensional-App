try:
    import torch
except ImportError:
    print("Error: torch is not installed.")
    torch = None

from .config import MODEL_NAME, SUMMARIZER_MODEL, SENTIMENT_MODEL

class ExpertAIModel:
    def __init__(self):
        print(f"Loading Expert AI Model ({MODEL_NAME})...")
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
            self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            self.model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
            
            # Specialized pipelines for auxiliary tasks
            self.summarizer = pipeline("summarization", model=SUMMARIZER_MODEL)
            self.sentiment_task = pipeline("sentiment-analysis", model=SENTIMENT_MODEL)
            print("Expert AI System Online!")
        except Exception as e:
            print(f"Error initializing Expert AI: {e}")
            self.tokenizer = None
            self.model = None
            self.summarizer = None
            self.sentiment_task = None

    def generate_chat_response(self, text, chat_history_ids=None):
        if not self.model or not self.tokenizer or not torch:
            return "Expert AI is currently in offline mode (model or torch failed to load).", None

        try:
            # Encode the new user input, add the eos_token and return a tensor in Pytorch
            new_user_input_ids = self.tokenizer.encode(text + self.tokenizer.eos_token, return_tensors='pt')

            # Append the new user input tokens to the chat history
            bot_input_ids = torch.cat([torch.tensor(chat_history_ids), new_user_input_ids], dim=-1) if chat_history_ids else new_user_input_ids

            # Generate a response while limiting the total chat history to 1000 tokens
            # Using sampling for more creative and human-like responses (like Gemini)
            chat_history_ids = self.model.generate(
                bot_input_ids, 
                max_length=1000, 
                pad_token_id=self.tokenizer.eos_token_id,
                do_sample=True,
                top_k=50,
                top_p=0.95,
                temperature=0.7
            )

            # Decode the last output tokens from the bot
            reply = self.tokenizer.decode(chat_history_ids[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True)
            
            if not reply.strip():
                reply = "I am processing your request with my expert neural networks. Could you please elaborate?"
                
            return reply, chat_history_ids.tolist()
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Error: {str(e)}", None

    def summarize_text(self, text):
        if self.summarizer and len(text) > 50:
            try:
                result = self.summarizer(text, max_length=150, min_length=40, do_sample=False)
                return result[0]['summary_text']
            except Exception as e:
                print(f"Error summarizing: {e}")
                return f"Error summarizing: {str(e)}"
        return f"Summary: {text[:100]}..."

    def analyze_sentiment(self, text):
        if self.sentiment_task:
            try:
                result = self.sentiment_task(text)
                return f"Analysis: {result[0]['label']} confidence: {result[0]['score']:.4f}"
            except Exception as e:
                print(f"Error analyzing sentiment: {e}")
                return f"Error analyzing sentiment: {str(e)}"
        return "Sentiment analysis module not loaded."
