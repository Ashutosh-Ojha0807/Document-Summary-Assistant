import os
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

from paddleocr import TextDetection, TextRecognition

# Test with engine="transformers" and tiny model
print("Testing TextDetection with engine=transformers, tiny model...")
try:
    d = TextDetection(
        model_name="PP-OCRv6_tiny_det_safetensors",
        engine="transformers",
    )
    print("Det loaded OK:", d._model_name)
except Exception as e:
    print("Det failed:", e)

print("\nTesting TextRecognition with engine=transformers, tiny model...")
try:
    r = TextRecognition(
        model_name="PP-OCRv6_tiny_rec_safetensors",
        engine="transformers",
    )
    print("Rec loaded OK:", r._model_name)
except Exception as e:
    print("Rec failed:", e)
