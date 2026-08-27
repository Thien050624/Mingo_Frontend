import { useState } from "react";
import ImageLightbox from "../common/ImageLightbox";
import { isVideoUrl } from "../../utils/media";

function Media({ src, alt, className, onClick }) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        onClick={onClick}
        className={className}
        muted
        loop
        playsInline
        aria-label={alt}
      />
    );
  }
  return <img src={src} alt={alt} onClick={onClick} className={className} />;
}

export default function PostImageGrid({ images, post, commentsProps }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const authorName = post.author.name;

  if (!images || images.length === 0) return null;

  const altFor = (i, total) =>
    total > 1
      ? `Ảnh ${i + 1}/${total} trong bài viết của ${authorName}`
      : `Ảnh trong bài viết của ${authorName}`;

  const openLightbox = (i) => setLightboxIndex(i);

  let grid;

  if (images.length === 1) {
    grid = (
      <Media
        src={images[0]}
        alt={altFor(0, 1)}
        onClick={() => openLightbox(0)}
        className="w-full max-h-[520px] object-cover bg-zm-bg cursor-pointer"
      />
    );
  } else if (images.length === 2) {
    grid = (
      <div className="grid grid-cols-2 gap-0.5">
        {images.map((src, i) => (
          <Media
            key={i}
            src={src}
            alt={altFor(i, images.length)}
            onClick={() => openLightbox(i)}
            className="w-full h-64 object-cover bg-zm-bg cursor-pointer"
          />
        ))}
      </div>
    );
  } else if (images.length === 3) {
    grid = (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-96">
        <Media
          src={images[0]}
          alt={altFor(0, 3)}
          onClick={() => openLightbox(0)}
          className="row-span-2 w-full h-full object-cover bg-zm-bg cursor-pointer"
        />
        <Media
          src={images[1]}
          alt={altFor(1, 3)}
          onClick={() => openLightbox(1)}
          className="w-full h-full object-cover bg-zm-bg cursor-pointer"
        />
        <Media
          src={images[2]}
          alt={altFor(2, 3)}
          onClick={() => openLightbox(2)}
          className="w-full h-full object-cover bg-zm-bg cursor-pointer"
        />
      </div>
    );
  } else {
    const extra = images.length - 4;
    grid = (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-96">
        {images.slice(0, 4).map((src, i) => {
          const isLast = i === 3 && extra > 0;
          return (
            <div key={i} className="relative w-full h-full">
              <Media
                src={src}
                alt={altFor(i, images.length)}
                onClick={() => openLightbox(i)}
                className="w-full h-full object-cover bg-zm-bg cursor-pointer"
              />
              {isLast && (
                <div
                  aria-hidden="true"
                  onClick={() => openLightbox(i)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                >
                  +{extra}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {grid}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          post={post}
          commentsProps={commentsProps}
        />
      )}
    </>
  );
}
