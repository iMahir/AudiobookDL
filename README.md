# Audiobook Downloader

This project is a Node.js application that allows you to search for audiobooks, check their availability, and download the chapters as MP4 files. The application uses the Audible API for fetching audiobook data and `ffmpeg` to download and convert the chapters.

## Features
- **Search audiobooks**: Search for audiobooks by title and author.
- **Chapter availability check**: Automatically checks the availability of chapters for the selected audiobook.
- **Download chapters**: Downloads available chapters using `ffmpeg` and shows a progress bar for each download.
- **Custom download folder**: Option to specify where the downloaded chapters should be saved.

## Prerequisites
- Node.js installed on your system
- `ffmpeg` installed (ensure `ffmpeg` is available in your system's PATH)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/iMahir/AudiobookDL
   cd AudiobookDL
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Ensure `ffmpeg` is installed on your system. If not, you can install it [here](https://ffmpeg.org/download.html).

## Usage

1. Run the application:
   ```bash
   node index.js
   ```

2. Follow the prompts:
   - **Search**: Enter the name of the audiobook.
   - **Select**: Choose the audiobook from the list.
   - **Download**: Specify a download folder or use the default (`./downloads`).

3. The downloader will check for available chapters and download them, showing progress for each chapter.

## Example

```bash
📖 Enter the audiobook name: Zero to One
📚 Select a book to download: Zero to One - Peter Thiel, Blake Masters
📥 Enter the download folder (default is ./downloads): ./my-audiobooks
📚 Total chapters found for "Zero to One": 16
🔄 Downloading Chapter 1 of "Zero to One"...
📥 Downloading Chapter 1 | ██████████ | 100% | ETA: 0s
✅ Downloaded Chapter 1: ./my-audiobooks/Zero to One - Chapter 1.mp4
...
🎉 All chapters of "Zero to One" have been downloaded successfully!
```

## Notes

- The downloader automatically tries different chapter number formats (`01`, `001`, etc.) to ensure compatibility.
- If the first chapter is unavailable, the audiobook is marked as unavailable.

---

Enjoy downloading your audiobooks!
