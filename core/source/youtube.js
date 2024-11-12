
const isIos = true;// process.argv[3] == 'ios';
const ytdl = require(isIos ? "./module/@distube/ytdl-core" : '@distube/ytdl-core');

const getSourceURL = async (id) => {
  let time = Date.now();
  const info = await ytdl.getInfo(id);

  // Filter for audio formats
  const audios = ytdl.filterFormats(info.formats, 'audio');

  // Sort and select the best audio formats based on bitrate
  const bestAudioFormat = audios.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];
  const mp4Audios = audios.filter(format => format.mimeType.includes('audio/mp4'));
  const bestMp4AudioFormat = mp4Audios.sort((a, b) => b.audioBitrate - a.audioBitrate);
  const sameQualityAudios = audios.filter(format => format.audioBitrate === bestAudioFormat.audioBitrate && format.mimeType.includes('audio/webm'));
  const audioUrls = sameQualityAudios.map(format => format.url);
  time = Date.now() - time
  return {
    url: audioUrls[1] || bestAudioFormat.url,
    aac: bestMp4AudioFormat?.[1] ? bestMp4AudioFormat[1].url : (bestMp4AudioFormat?.[0] ? bestMp4AudioFormat?.[0].url : null),
    helper: audioUrls[0],
    took: time
  };
};
module.exports = { getSourceURL }