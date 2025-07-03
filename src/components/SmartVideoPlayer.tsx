import React from 'react';

interface SmartVideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

const getEmbedInfo = (url: string) => {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/
  );
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    };
  }

  // Direct MP4
  if (url.match(/\.mp4($|\?)/)) {
    return {
      type: 'mp4',
      embedUrl: url
    };
  }

  return { type: 'unknown', embedUrl: url };
};

const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({ url, title, className }) => {
  const { type, embedUrl } = getEmbedInfo(url);

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        <span>No video available</span>
      </div>
    );
  }

  switch (type) {
    case 'youtube':
    case 'vimeo':
    case 'gdrive':
      return (
        <div className={`aspect-video w-full ${className || ''}`}>
          <iframe
            src={embedUrl}
            title={title || 'Video Player'}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        </div>
      );
    case 'mp4':
      return (
        <div className={`aspect-video w-full ${className || ''}`}>
          <video controls className="w-full h-full bg-black" title={title || 'Video Player'}>
            <source src={embedUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
          <span>Unsupported video link</span>
        </div>
      );
  }
};

export default SmartVideoPlayer; 