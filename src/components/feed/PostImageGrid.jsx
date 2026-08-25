import { useState } from "react";
import ImageLightbox from "../common/ImageLightbox";

export default function PostImageGrid({ images, authorName }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!images || images.length === 0) return null;

  const altFor = (i, total) =>
    total > 1
      ? `Ảnh ${i + 1}/${total} trong bài viết của ${authorName}`
      : `Ảnh trong bài viết của ${authorName}`;

  const openLightbox = (i) => setLightboxIndex(i);

  if (images.length === 1) {
    return (
      <>
        <img
          src={images[0]}
          alt={altFor(0, 1)}
          onClick={() => openLightbox(0)}
          className="w-full max-h-[520px] object-cover bg-zm-bg cursor-pointer"
        />
        {lightboxIndex !== null && (
          <ImageLightbox
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </>
    );
  }

  if (images.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-0.5">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={altFor(i, images.length)}
              onClick={() => openLightbox(i)}
              className="w-full h-64 object-cover bg-zm-bg cursor-pointer"
            />
          ))}
        </div>
        {lightboxIndex !== null && (
          <ImageLightbox
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </>
    );
  }

  if (images.length === 3) {
    return (
      <>
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-96">
          <img
            src={images[0]}
            alt={altFor(0, 3)}
            onClick={() => openLightbox(0)}
            className="row-span-2 w-full h-full object-cover bg-zm-bg cursor-pointer"
          />
          <img
            src={images[1]}
            alt={altFor(1, 3)}
            onClick={() => openLightbox(1)}
            className="w-full h-full object-cover bg-zm-bg cursor-pointer"
          />
          <img
            src={images[2]}
            alt={altFor(2, 3)}
            onClick={() => openLightbox(2)}
            className="w-full h-full object-cover bg-zm-bg cursor-pointer"
          />
        </div>
        {lightboxIndex !== null && (
          <ImageLightbox
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </>
    );
  }

  const extra = images.length - 4;

  return (
    <>
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-96">
        {images.slice(0, 4).map((src, i) => {
          const isLast = i === 3 && extra > 0;
          return (
            <div key={i} className="relative w-full h-full">
              <img
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
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
