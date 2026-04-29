Release package for Sanskrit-master

How this package was produced:
- `backend/requirements_freeze.txt` contains pinned Python dependencies.
- `frontend-react/dist/` contains the production frontend bundle.

To run from package (developer machine):
1. Extract the ZIP.
2. Create a Python virtualenv and install `requirements_freeze.txt`.
3. Serve with `uvicorn backend.main:app --host 127.0.0.1 --port 8000` from the extracted folder.
4. Serve the frontend `dist/` with a static server or run the included frontend dev workflow.

Notes:
- Heavy model files and local caches are excluded from the package; indic model weights are downloaded on first run if HF_TOKEN available.
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` and `HF_TOKEN` env vars are set before starting the backend.
