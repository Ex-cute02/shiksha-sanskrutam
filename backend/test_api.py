from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained("google/byt5-small")
model = AutoModelForSeq2SeqLM.from_pretrained("google/byt5-small")
print("Model loaded successfully!")

inputs = tokenizer("अहम् विद्यालयं गच्छति", return_tensors="pt")

# Added max_new_tokens to allow full sentence generation
outputs = model.generate(**inputs, max_new_tokens=100) 

print("Output:", tokenizer.decode(outputs[0], skip_special_tokens=True))