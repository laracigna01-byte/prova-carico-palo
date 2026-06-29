export function compressImage(file, maxWidth = 1600, quality = 0.76) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve({
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          name: file.name,
          dataUrl: canvas.toDataURL("image/jpeg", quality)
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function compressImages(files) {
  const list = Array.from(files || []);
  return Promise.all(list.map((file) => compressImage(file)));
}
