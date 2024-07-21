// @ts-nocheck
export const ImportImage = (props: {
  onImage: (image: HTMLImageElement) => void;
}) => {
  return (
    <input
      onChange={(event) => {
        const fileInfo = event.target.files[0];
        const fileReader = new FileReader();

        fileReader.onload = (e) => {
          const image = new Image();
          image.src = e.target.result;
          image.name = fileInfo.name;
          image.onload = () => {
            props.onImage(image);
          };
        };

        fileReader.readAsDataURL(fileInfo);
      }}
      type="file"
      id="imageUpload"
      accept="image/*"
    />
  );
};
