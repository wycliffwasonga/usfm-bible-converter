/* jshint esversion: 6 */

var rcuv = require('rcuv-usfm');
var converter  = require('./modules/html');
var parser = require('usfm-bible-parser')(rcuv.pathOfFiles, rcuv.language);
var books;

function getBookShortName(bookName) {

  return Promise.resolve().then( ()=> {
    if (books) {
      return books;
    }

    books = parser.getBooks();
    return books;

  }).then( books => {

    return books.find( book => {
      return book.localizedData.name == bookName ||
             book.localizedAltNames.indexOf(bookName) != -1;
    });

  }).then (book => {

    if (book) {
      return book.shortName;
    } else {
      throw new Error('Book not found: ' + bookName);
    }

  });
}



function parseScripture(scripture) {

  scripture = scripture.replace('～', '-');
  scripture = scripture.replace('：', ':');
  scripture = scripture.replace(/ /g, '');

  var parts;
  var matches = scripture.match(/^\D+\d/);
  if (matches) {
    parts = [
      matches[0].substring(0,matches[0].length-1),
      scripture.substring(matches[0].length-1)
    ];
  } else {
    throw new Error('Parse error: ' + scripture);
  }

  //console.log(parts[1], scripture);

  return getBookShortName(parts[0])
  .then( shortName => {

    var result = {};
    result.bookName = shortName;

    if (parts.length > 1) {
      parts = parts[1].split('-');
      var fromParts = parts[0].split(':');
      var toParts = parts.length > 1 ? parts[1].split(':'):undefined;

      if (fromParts.length == 1) {
        fromParts = ['1', fromParts[0]];
      }
      result.fromChapter = parseInt(fromParts[0]);
      result.fromVerse = fromParts.length > 1 ? parseInt(fromParts[1]):undefined;
      if (toParts) {
        result.toChapter = toParts.length > 1 ? parseInt(toParts[0]):result.fromChapter;
        result.toVerse = toParts.length > 1 ? parseInt(toParts[1]):parseInt(toParts[0]);
      } else {
        result.toChapter = result.fromChapter;
        result.toVerse = result.fromVerse;
      }
    } else {
      throw new Error('Parse error: ' + scripture);
    }

    if (!result.fromChapter || !result.fromVerse ||
        !result.toChapter) {

      console.log(result);
      throw new Error('Parse error: ' + scripture);
    }

    return result;
  });
}


function convertScripture(scripture, opts) {

  opts = opts || {};

  return parseScripture(scripture)
  .then( result => {

    Object.assign(opts, result);
    Object.assign(opts, {
      inputDir: rcuv.pathOfFiles,
      outputDir: opts.outputDir,
      lang: rcuv.language
    });

    return converter.convertBook(opts.bookName, opts);
  });

}


module.exports = {
  convertScripture: convertScripture
};
