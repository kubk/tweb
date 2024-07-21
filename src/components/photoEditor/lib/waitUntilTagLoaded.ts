export const waitUntilImageLoaded = (img: HTMLImageElement): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    if(img.complete) {
      return resolve(img)
    }
    img.onload = () => resolve(img)
  })
}

export const waitUntilVideoLoaded = (video: HTMLVideoElement): Promise<HTMLVideoElement> => {
  return new Promise((resolve) => {
    if(video.readyState >= 4) {
      return resolve(video)
    }
    video.onload = () => resolve(video)
  })
}
