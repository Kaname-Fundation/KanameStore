# KanameStore

This is the official App Store registry for KanameOS.

## How it works

This repository serves as a static registry of available applications. The `repository.json` file is generated automatically via GitHub Actions and served via GitHub Pages.

## Adding an App

1. Create a JSON file in the `manifests/` directory.
2. The filename should be unique (e.g., `my-app.json`).
3. Use the following format:

```json
{
  "name": "MyApp",
  "version": "1.0.0",
  "description": "My cool application",
  "author": "Your Name",
  "category": "Utilities",
  "icon": "https://url-to-icon.png",
  "download": "https://url-to-your-built-bundle.zip",
  "main": "index.js"
}
```

4. Submit a Pull Request.
5. Once merged, the GitHub Action will rebuild the `repository.json` and the app will appear in the store.

## API

The registry is available at:
`https://<username>.github.io/KanameStore/repository.json`
