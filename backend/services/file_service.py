"""File storage service providing safe, sandboxed upload handling."""

import os
import re
import uuid
import time
from typing import Dict, Optional, Tuple
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {
    "exam", "stu", "exm", "crs", "slo", "room", "rooms", "csv", "txt", "json"
}

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB limit per file


class FileSecurityError(Exception):
    """Raised when an uploaded file violates safety or extension rules."""
    pass


class FileService:
    """Manages file storage, filename sanitization, and path traversal protection."""

    def __init__(self, upload_root: Optional[str] = None):
        if upload_root is None:
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            upload_root = os.path.join(backend_dir, "data", "uploads")
        self.upload_root = os.path.abspath(upload_root)
        os.makedirs(self.upload_root, exist_ok=True)

    def is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is in the allowed whitelist."""
        if not filename or "." not in filename:
            return False
        ext = filename.rsplit(".", 1)[1].lower()
        return ext in ALLOWED_EXTENSIONS

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename using secure_filename and remove special characters."""
        if not filename:
            raise FileSecurityError("Filename cannot be empty.")

        # Clean with secure_filename
        clean_name = secure_filename(filename)
        # Extra safety check against null bytes or empty strings
        if not clean_name or clean_name in {".", ".."}:
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
            clean_name = f"upload_{uuid.uuid4().hex[:8]}.{ext}"

        return clean_name

    def create_dataset_directory(self) -> Tuple[str, str]:
        """Generate a unique dataset folder inside the upload directory.
        
        Returns:
            Tuple of (dataset_id, absolute_folder_path)
        """
        timestamp = int(time.time())
        unique_suffix = uuid.uuid4().hex[:8]
        dataset_id = f"ds_{timestamp}_{unique_suffix}"
        
        folder_path = os.path.abspath(os.path.join(self.upload_root, dataset_id))

        # Path traversal guard: verify folder_path is directly within upload_root
        if not folder_path.startswith(self.upload_root) or os.path.dirname(folder_path) != self.upload_root:
            raise FileSecurityError("Security violation: Invalid upload directory target.")

        os.makedirs(folder_path, exist_ok=True)
        return dataset_id, folder_path

    def save_file(self, file_storage, target_folder: str, role: str) -> str:
        """Safely save a file storage object into the target folder.
        
        Args:
            file_storage: Werkzeug FileStorage object
            target_folder: Absolute path to the validated dataset directory
            role: Descriptive role of file (e.g., 'exam_file', 'stu_file', 'room_file')
            
        Returns:
            Saved absolute filepath
        """
        original_name = getattr(file_storage, "filename", "") or ""
        if not self.is_allowed_file(original_name):
            ext = original_name.rsplit(".", 1)[-1] if "." in original_name else "unknown"
            raise FileSecurityError(
                f"File type '.{ext}' for {role} is not permitted. "
                f"Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        safe_name = self.sanitize_filename(original_name)
        # Prefix with role to avoid filename collisions
        prefixed_name = f"{role}_{safe_name}"
        destination = os.path.abspath(os.path.join(target_folder, prefixed_name))

        # Guard: destination must be inside target_folder
        if not destination.startswith(target_folder):
            raise FileSecurityError("Path traversal attempt detected.")

        file_storage.save(destination)

        # Check file size
        file_size = os.path.getsize(destination)
        if file_size > MAX_FILE_SIZE:
            os.remove(destination)
            raise FileSecurityError(
                f"File {safe_name} exceeds maximum permitted size of {MAX_FILE_SIZE // (1024 * 1024)} MB."
            )

        if file_size == 0:
            os.remove(destination)
            raise FileSecurityError(f"Uploaded file {safe_name} is empty (0 bytes).")

        return destination
