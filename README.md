# CMSC 471 Assignment 2: White Hat / Black Hat Visualization

This website compares an accurate and a deceptive visualization built from ProPublica's release of New York City Civilian Complaint Review Board records.

## Run locally

Because the page loads a CSV file, open it through a local web server instead of double-clicking `index.html`.

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Project files

- `index.html` — page content and write-ups
- `style.css` — page and chart styling
- `script.js` — data transformations and D3 visualizations
- `data/allegations.csv` — reduced ProPublica/CCRB allegation-level data containing only year, category, and disposition (the three fields used by the charts)

## Deploy with GitHub Pages

1. Create a GitHub repository and add these project files.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.
5. Copy the published URL into the Canvas submission and `submission.txt`.

No build command or package installation is required.
