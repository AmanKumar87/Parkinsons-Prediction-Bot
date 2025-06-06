from pydub import AudioSegment
import os

# Create a dummy audio file (you might need to copy a small .webm here)
# For a more direct test, create a small, known good .wav file locally
# or record a very short one in browser and save it manually
# and replace 'your_recorded_audio.webm' with its path.
# Let's assume you have a 1-second silence.webm
try:
    # Create a 1-second silent WebM file for testing
    silent_audio = AudioSegment.silent(duration=1000) # milliseconds
    silent_audio.export("test_input.webm", format="webm")
    print("Created test_input.webm")

    audio_file = AudioSegment.from_file("test_input.webm", format="webm")
    audio_file.export("test_output.wav", format="wav")
    print("Successfully converted test_input.webm to test_output.wav")
except Exception as e:
    print(f"Error during pydub conversion test: {e}")
    print("Make sure ffmpeg is installed and in your system's PATH.")
finally:
    if os.path.exists("test_input.webm"):
        os.remove("test_input.webm")
    if os.path.exists("test_output.wav"):
        os.remove("test_output.wav")