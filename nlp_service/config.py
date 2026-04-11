# NLP Service Configuration

# Using DialoGPT-small for faster loading and lower resource usage
# This model is very lightweight and perfect for testing the system.
MODEL_NAME = "microsoft/DialoGPT-small"

# Specialized pipelines for auxiliary tasks
SUMMARIZER_MODEL = "facebook/bart-large-cnn"
SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"

# AI Personality / System Prompt (Simulated)
# Since DialoGPT is a conversational model, we can prepend context to guide its behavior.
AI_PERSONALITY = "You are an advanced AI assistant, similar to Gemini. You are helpful, insightful, and expert in all fields. You provide detailed and coherent responses."
