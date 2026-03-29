from cryptography.fernet import Fernet
import os

# 1. Key Management: Generate a key and save it securely
def generate_and_save_key(key_filename="secret.key"):
    """Generates a key and saves it to a file."""
    key = Fernet.generate_key()
    with open(key_filename, "wb") as key_file:
        key_file.write(key)
    print(f"Key generated and saved to {key_filename}")

def load_key(key_filename="secret.key"):
    """Loads the key from the current directory or generates a new one if not found."""
    if not os.path.exists(key_filename):
        generate_and_save_key(key_filename)
    return open(key_filename, "rb").read()

# 2. Encryption and Decryption
def encrypt_message(message, key):
    """Encrypts a message using the provided key."""
    encoded_message = message.encode() # Data must be a byte string
    f = Fernet(key)
    encrypted_message = f.encrypt(encoded_message)
    return encrypted_message

def decrypt_message(encrypted_message, key):
    """Decrypts an encrypted message using the provided key."""
    f = Fernet(key)
    decrypted_message = f.decrypt(encrypted_message).decode() # Decode byte string back to a string
    return decrypted_message

# Demonstration
if __name__ == "__main__":
    # Ensure a key exists
    encryption_key = load_key()

    original_message = "Hello, Python encryption world!"
    print(f"Original message: {original_message}")

    # Encrypt the message
    encrypted_msg = encrypt_message(original_message, encryption_key)
    print(f"Encrypted message (bytes): {encrypted_msg}")

    # Decrypt the message
    decrypted_msg = decrypt_message(encrypted_msg, encryption_key)
    print(f"Decrypted message: {decrypted_msg}")
