const axios = require('axios');
const { Select, Input } = require('enquirer');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');

class AudiobookDownloader {
  constructor() {
    this.downloadPath = './downloads';
  }

  async fetchAudiobookData(query) {
    const apiUrl = `https://api.audible.com/1.0/searchsuggestions?&key_strokes=${encodeURIComponent(query)}&site_variant=desktop`;
    try {
      const response = await axios.get(apiUrl);
      const items = response.data?.model?.items || [];
      return await this.filterValidBooks(items);
    } catch (error) {
      console.error('❌ Error fetching audiobook data:', error.message);
      process.exit(1);
    }
  }

  async filterValidBooks(items) {
    const validBooks = await Promise.all(items.map(async (item) => {
      const productMetadata = item.model?.product_metadata;
      if (productMetadata) {
        const asin = productMetadata.asin;
        const firstChapterAvailable = await this.isValidM3U8Link(asin, 1);
        return firstChapterAvailable ? { title: productMetadata.title.value, author: productMetadata.author_name.value || "Unknown", asin } : null;
      }
      return null;
    }));
    return validBooks.filter(book => book !== null);
  }

  async isValidM3U8Link(asin, chapterNumber) {
    const chapterFormats = [
      String(chapterNumber).padStart(2, '0'), // "01", "02", etc.
      String(chapterNumber).padStart(3, '0')  // "001", "002", etc.
    ];
    
    for (const chapter of chapterFormats) {
      const m3u8Url = `https://files01.freeaudiobooks.net/audio/${asin}/Chapter%20${chapter}.m3u8`;
      try {
        await axios.get(m3u8Url);
        return m3u8Url;
      } catch {}
    }
    return null; // Return null if no valid URL found
  }

  async countChapters(asin) {
    let chapterCount = 0;
    let chapterNumber = 1;

    while (true) {
      const m3u8Url = await this.isValidM3U8Link(asin, chapterNumber);
      if (!m3u8Url) break;
      chapterCount++;
      chapterNumber++;
    }
    
    return chapterCount;
  }

  async downloadChapter(asin, title, chapterNumber) {
    const m3u8Url = await this.isValidM3U8Link(asin, chapterNumber);
    if (!m3u8Url) {
      console.log(`\n📚 No more chapters found. Stopping at Chapter ${chapterNumber - 1}.`);
      return false;
    }

    const outputFilePath = path.join(this.downloadPath, `${title} - Chapter ${chapterNumber}.mp4`);
    console.log(`\n🔄 Downloading Chapter ${chapterNumber} of "${title}"...`);

    return new Promise((resolve) => {
      const bar = new cliProgress.SingleBar({
        format: `📥 Downloading Chapter ${chapterNumber} | {bar} | {percentage}% | ETA: {eta}s`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      }, cliProgress.Presets.shades_classic);

      ffmpeg(m3u8Url)
        .on('start', () => bar.start(100, 0))
        .on('progress', (progress) => {
          bar.update(Math.round(progress.percent));
        })
        .on('error', (err) => {
          bar.stop();
          console.error(`❌ Error downloading Chapter ${chapterNumber}: ${err.message}`);
          resolve(false);
        })
        .on('end', () => {
          bar.update(100);
          bar.stop();
          console.log(`✅ Downloaded Chapter ${chapterNumber}: ${outputFilePath}`);
          resolve(true);
        })
        .save(outputFilePath);
    });
  }

  async downloadAudiobook(asin, title) {
    const firstChapterUrl = await this.isValidM3U8Link(asin, 1);
    if (!firstChapterUrl) {
      console.log(`🚫 Audiobook "${title}" not available.`);
      return;
    }

    const totalChapters = await this.countChapters(asin);
    console.log(`\n📚 Total chapters found for "${title}": ${totalChapters}`);

    let chapterNumber = 1;
    while (true) {
      const success = await this.downloadChapter(asin, title, chapterNumber);
      if (!success) break;
      chapterNumber++;
    }
    console.log(`\n🎉 All chapters of "${title}" have been downloaded successfully!`);
  }

  async promptUser() {
    const bookNamePrompt = new Input({ message: '📖 Enter the audiobook name:' });
    const bookName = await bookNamePrompt.run();

    const books = await this.fetchAudiobookData(bookName);
    if (books.length === 0) {
      console.log('🔍 No books found. Please try again.');
      return;
    }

    const choices = books.map((book) => ({
      name: `${book.title} - ${book.author}`,
      value: book.asin
    }));

    const bookSelector = new Select({
      name: 'book',
      message: '📚 Select a book to download:',
      choices: choices.map(choice => choice.name)
    });

    const selectedBookTitle = await bookSelector.run();
    const selectedBook = choices.find(choice => choice.name === selectedBookTitle);

    const downloadPathPrompt = new Input({
      message: '📥 Enter the download folder (default is ./downloads):',
      initial: this.downloadPath
    });
    this.downloadPath = await downloadPathPrompt.run();

    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }

    await this.downloadAudiobook(selectedBook.value, selectedBookTitle);
  }
}

// Run the audiobook downloader
const downloader = new AudiobookDownloader();
downloader.promptUser();
